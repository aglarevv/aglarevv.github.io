## 部署

### 二进制部署Kubernetes

<details>
<summary>二进制部署Kubernetes</summary>

> 

准备环境

```
1、关闭防⽕墙和selinux
2、关闭交换空间：
临时关闭：swapoff -a
永久关闭：
vi /etc/fstab
找到如下内容：注释或删除
#/dev/sdX none swap sw 0 0
3、做域名解析
vi etc/hosts
192.168.209.143 k8s-master
192.168.209.11 k8s-node1
192.168.209.12 k8s-node2
```

#### k8s-master

<details>
<summary>k8s-master</summary>

> 

1、下载cfssl工具

```
wget https://pkg.cfssl.org/R1.2/cfssl_linux-amd64
wget https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64
wget https://pkg.cfssl.org/R1.2/cfssl-certinfo_linux-amd64
```

1-1、授予权限

```
chmod +x cfssl_linux-amd64 cfssljson_linux-amd64 cfssl-certinfo_linux-amd64
```

1-2、移动目录

```
mv cfssl_linux-amd64 /usr/local/bin/cfssl
mv cfssljson_linux-amd64 /usr/local/bin/cfssljson
mv cfssl-certinfo_linux-amd64 /usr/local/bin/cfssl-certinfo
```

1-3、生成etcd证书

```
mkdir cert
cd cert/
```

> vim ca-config.json

```
{
 "signing": {
   "default": {
     "expiry": "87600h"
   },
   "profiles": {
     "www": {
       "expiry": "87600h",
       "usages": [
         "signing",
         "key encipherment",
         "server auth",
         "client auth"
       ]
     }
   }
 }
}
```

> vim ca-csr.json

```
{
    "CN": "etcd CA",
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "Beijing",
            "ST": "Beijing"
        }
    ]
}
```

> vim server-csr.json

```
{
    "CN": "etcd",
    "hosts": [
        "192.168.209.143",
        "192.168.209.11",
        "192.168.209.12"
    ],
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "BeiJing",
            "ST": "BeiJing"
        }
    ]
}
```

1-4、生成ca证书

```
cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
```

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=www server-csr.json | cfssljson -bare server
```

```
效果示例：
[root@k8s-master cert] ls *pem
ca-key.pem ca.pem server-key.pem server.pem

server.pem 要用的证书
server-key.pem 要用的私钥
```

</details>

#### k8s-master & k8s-node

<details>
<summary>k8s-master & k8s-node</summary>

> 

1、安装Etcd

```
wget https://github.com/etcd-io/etcd/releases/download/v3.2.12/etcd-v3.2.12-linux-amd64.tar.gz
```

```
mkdir /opt/etcd/{bin,cfg,ssl} -p 
tar zxvf etcd-v3.2.12-linux-amd64.tar.gz
mv etcd-v3.2.12-linux-amd64/{etcd,etcdctl} /opt/etcd/bin/
```

1-1、编写配置文件

> vim /opt/etcd/cfg/etcd

```
#[Member]
ETCD_NAME="etcd01"
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
ETCD_LISTEN_PEER_URLS="https://192.168.209.143:2380"
ETCD_LISTEN_CLIENT_URLS="https://192.168.209.143:2379"
#[Clustering]
ETCD_INITIAL_ADVERTISE_PEER_URLS="https://192.168.209.143:2380"
ETCD_ADVERTISE_CLIENT_URLS="https://192.168.209.143:2379"
ETCD_INITIAL_CLUSTER="etcd01=https://192.168.209.143:2380,etcd02=https://192.168.209.11:2380,etcd03=https://192.168.209.12:2380"
ETCD_INITIAL_CLUSTER_TOKEN="etcd-cluster"
ETCD_INITIAL_CLUSTER_STATE="new"
```

**解释：**

```
#[Member]
ETCD_NAME="etcd01" #节点名称，各个节点不能相同
ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
ETCD_LISTEN_PEER_URLS="https://192.168.209.143:2380" #写每个节点自己的ip
ETCD_LISTEN_CLIENT_URLS="https://192.168.209.143:2379" #写每个节点自己的ip
#[Clustering]
ETCD_INITIAL_ADVERTISE_PEER_URLS="https://192.168.209.143:2380" #写每个节点的ip
ETCD_ADVERTISE_CLIENT_URLS="https://192.168.209.143:2379" #写每个节点的ip
ETCD_INITIAL_CLUSTER="etcd01=https://192.168.209.143:2380,etcd02=https://192.168.209.11:2380,etcd03=https://192.168.209.12:2380"
ETCD_INITIAL_CLUSTER_TOKEN="etcd-cluster"
ETCD_INITIAL_CLUSTER_STATE="new"

* ETCD_NAME 节点名称,每个节点名称不⼀样
* ETCD_DATA_DIR 存储数据⽬录(他是⼀个数据库，不是存在内存的，存在硬盘中的，所有和k8s
有关的信息都会存到etcd⾥面的)
* ETCD_LISTEN_PEER_URLS 集群通信监听地址
* ETCD_LISTEN_CLIENT_URLS 客户端访问监听地址
* ETCD_INITIAL_ADVERTISE_PEER_URLS 集群通告地址
* ETCD_ADVERTISE_CLIENT_URLS 客户端通告地址
* ETCD_INITIAL_CLUSTER 集群节点地址
* ETCD_INITIAL_CLUSTER_TOKEN 集群Token
* ETCD_INITIAL_CLUSTER_STATE 加⼊集群的当前状态，new是新集群，existing表示加⼊已有集群
```

1-2、配置systemctl管理Etcd

> vim /usr/lib/systemd/system/etcd.service

```
[Unit]
Description=Etcd Server
After=network.target
After=network-online.target
Wants=network-online.target
[Service]
Type=notify
EnvironmentFile=/opt/etcd/cfg/etcd
ExecStart=/opt/etcd/bin/etcd \
--name=${ETCD_NAME} \
--data-dir=${ETCD_DATA_DIR} \
--listen-peer-urls=${ETCD_LISTEN_PEER_URLS} \
--listen-client-urls=${ETCD_LISTEN_CLIENT_URLS},http://127.0.0.1:2379 \
--advertise-client-urls=${ETCD_ADVERTISE_CLIENT_URLS} \
--initial-advertise-peer-urls=${ETCD_INITIAL_ADVERTISE_PEER_URLS} \
--initial-cluster=${ETCD_INITIAL_CLUSTER} \
--initial-cluster-token=${ETCD_INITIAL_CLUSTER_TOKEN} \
--initial-cluster-state=new \
--cert-file=/opt/etcd/ssl/server.pem \
--key-file=/opt/etcd/ssl/server-key.pem \
--peer-cert-file=/opt/etcd/ssl/server.pem \
--peer-key-file=/opt/etcd/ssl/server-key.pem \
--trusted-ca-file=/opt/etcd/ssl/ca.pem \
--peer-trusted-ca-file=/opt/etcd/ssl/ca.pem
Restart=on-failure
LimitNOFILE=65536
[Install]
WantedBy=multi-user.target
```

1、k8s-master传输证书

```
cd /root/cert/
cp ca*pem server*pem /opt/etcd/ssl
scp ca*pem server*pem k8s-node1:/opt/etcd/ssl
scp ca*pem server*pem k8s-node2:/opt/etcd/ssl
```

2、全部设置开机启动

```
systemctl daemon-reload
systemctl start etcd
systemctl enable etcd
```

3、检查Etcd集群状态

```
/opt/etcd/bin/etcdctl --ca-file=/opt/etcd/ssl/ca.pem --cert-file=/opt/etcd/ssl/server.pem --key-file=/opt/etcd/ssl/server-key.pem --endpoints="https://192.168.209.143:2379,https://192.168.209.11:2379,https://192.168.209.12:2379" cluster-health
```

**成功示例：**

```
member 7bf5e8410987571e is healthy: got healthy result from https://192.168.209.12:2379
member b9b1e4107f37b0bc is healthy: got healthy result from https://192.168.209.11:2379
member b9e4274e43b72901 is healthy: got healthy result from https://192.168.209.143:2379
cluster is healthy
```

</details>

#### 部署flannel网络插件

<details>
<summary>部署flannel网络插件</summary>

> 

> 在node节点部署，如果没有在master部署应用，那就不要在master部署flannel，他是用来给所有 的容器用来通信的。

1、将生成的证书copy到剩下的机器上面

```
scp -r /root/cert/ k8s-node1:/root/
```

```
cd cert
```

2、使用 etcdctl 命令设置 flannel 的网络配置在 etcd 中

```
/opt/etcd/bin/etcdctl --ca-file=ca.pem --cert-file=server.pem --key-file=server-key.pem --endpoints="https://192.168.209.143:2379,https://192.168.209.11:2379,https://192.168.209.12:2379" set /coreos.com/network/config '{ "Network": "172.17.0.0/16", "Backend": { "Type": "vxlan" } }'
```

**以下步骤在规划的每个node节点都操作。**

3、下载Flannel插件安装包

```
wget https://github.com/coreos/flannel/releases/download/v0.10.0/flannel-v0.10.0-linux-amd64.tar.gz
tar zxvf flannel-v0.10.0-linux-amd64.tar.gz
mkdir -pv /opt/kubernetes/bin
mv flanneld mk-docker-opts.sh /opt/kubernetes/bin
```

4、配置Flannel

```
mkdir -p /opt/kubernetes/cfg/
vim /opt/kubernetes/cfg/flanneld
```

```
cat /opt/kubernetes/cfg/flanneld

FLANNEL_OPTIONS="--etcd-endpoints=https://192.168.209.143:2379,https://192.168.209.11:2379,https://192.168.209.12:2379 -etcd-cafile=/opt/etcd/ssl/ca.pem -etcd-certfile=/opt/etcd/ssl/server.pem -etcd-keyfile=/opt/etcd/ssl/server-key.pem"
```

5、配置systemctl启动Flannel

```
vim /usr/lib/systemd/system/flanneld.service

[Unit]
Description=Flanneld overlay address etcd agent
After=network-online.target network.target
Before=docker.service
[Service]
Type=notify
EnvironmentFile=/opt/kubernetes/cfg/flanneld
ExecStart=/opt/kubernetes/bin/flanneld --ip-masq $FLANNEL_OPTIONS
ExecStartPost=/opt/kubernetes/bin/mk-docker-opts.sh -k DOCKER_NETWORK_OPTIONS -d /run/flannel/subnet.env
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

6、配置Docker的启动项

> 配置Docker启动指定⼦网段：可以将源文件直接覆盖掉

```
vim /usr/lib/systemd/system/docker.service

[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network-online.target firewalld.service
Wants=network-online.target
[Service]
Type=notify
EnvironmentFile=/run/flannel/subnet.env
ExecStart=/usr/bin/dockerd $DOCKER_NETWORK_OPTIONS
ExecReload=/bin/kill -s HUP $MAINPID
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
TimeoutStartSec=0
Delegate=yes
KillMode=process
Restart=on-failure
StartLimitBurst=3
StartLimitInterval=60s
[Install]
WantedBy=multi-user.target
```

7、重启flannel和docker

```
systemctl daemon-reload
systemctl start flanneld
systemctl enable flanneld etcd docker
systemctl restart docker
```

8、测试

```
node1 :
$ ip -a
找到docker的地址，去node2 ping

node2 :
$ ip -a
找到docker 地址  去node1 ping
```

</details>

#### 在Master节点部署组件

<details>
<summary>在Master节点部署组件</summary>

> 

##### 准备证书

<details>
<summary>准备证书</summary>

> 

> 部署Kubernetes之前⼀定要确保etcd、flannel、docker是正常工作的，否则先解决问题再继续。
> 检查etcd：
> /opt/etcd/bin/etcdctl --ca-file=/opt/etcd/ssl/ca.pem --cert-file=/opt/etcd/ssl/server.pem --key-file=/opt/etcd/ssl/server-key.pem --endpoints="https://192.168.209.143:2379,https://192.168.209.11:2379,https://192.168.209.12:2379" cluster-health

1、生成证书（给api-server创建的证书，别的服务访问api-server的时候需要通过证书认证
）

```
mkdir -p /opt/crt/
cd /opt/crt/
vim ca-config.json

{
    "signing": {
        "default": {
            "expiry": "87600h"
        },
        "profiles": {
            "kubernetes": {
                "expiry": "87600h",
                "usages": [
                    "signing",
                    "key encipherment",
                    "server auth",
                    "client auth"
                ]
            }
        }
    }
}
```

```
vim ca-csr.json  #定义生产签名所需要的信息参数

{
    "CN": "kubernetes",
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "Beijing",
            "ST": "Beijing",
            "O": "k8s",
            "OU": "System"
        }
    ]
}
```

2、生产ca证书和私钥

```
cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
```

3、生成apiserver证书

```
vim server-csr.json

{
    "CN": "kubernetes",
    "hosts": [
        "10.0.0.1", 	#这是后⾯dns要使用的虚拟网络的网关，不用改，就用这个切忌
        "127.0.0.1",
        "192.168.209.143", 	# master的IP地址。
        "192.168.209.11",
        "192.168.209.12",
        "kubernetes",
        "kubernetes.default",
        "kubernetes.default.svc",
        "kubernetes.default.svc.cluster",
        "kubernetes.default.svc.cluster.local"
    ],
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "BeiJing",
            "ST": "BeiJing",
            "O": "k8s",
            "OU": "System"
        }
    ]
}
```

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes server-csr.json | cfssljson -bare server
```

4、生成kube-proxy证书

```
vim kube-proxy-csr.json

{
    "CN": "system:kube-proxy",
    "hosts": [],
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "BeiJing",
            "ST": "BeiJing",
            "O": "k8s",
            "OU": "System"
        }
    ]
}
```

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes kube-proxy-csr.json | cfssljson -bare kube-proxy
```

最终效果：

```
[root@master crt]# ls *.pem

ca-key.pem  ca.pem  kube-proxy-key.pem  kube-proxy.pem  server-key.pem  server.pem
```

</details>

##### master节点部署apiserver组件

<details>
<summary>master节点部署apiserver组件</summary>

> 

1、下载二进制包

```
wget https://dl.k8s.io/v1.11.10/kubernetes-server-linux-amd64.tar.gz
mkdir /opt/kubernetes/{bin,cfg,ssl} -pv
tar zxvf kubernetes-server-linux-amd64.tar.gz

cd kubernetes/server/bin
cp kube-apiserver kube-scheduler kube-controller-manager kubectl /opt/kubernetes/bin

因为在本机生成的证书 直接拷贝即可
cp /opt/crt/*.pem /opt/kubernetes/ssl/
```

2、创建token文件

```
cd /opt/kubernetes/cfg/
vim token.csv

674c457d4dcf2eefe4920d7dbb6b0ddc,kubelet-bootstrap,10001,"system:kubelet-bootstrap"
第⼀列：随机字符串，自⼰可生成
第二列：用户名
第三列：UID
第四列：用户组
```

3、创建apiserver配置文件

```
cd /opt/kubernetes/cfg
vim kube-apiserver	#不要有多余空格换行等

KUBE_APISERVER_OPTS="--logtostderr=true \
--v=4 \
--etcd-servers=https://192.168.209.143:2379,https://192.168.209.11:2379,https://192.168.209.12:2379 \
--bind-address=192.168.209.143 \#master的ip地址，就是安装api-server的机器地址
--secure-port=6443 \
--advertise-address=192.168.209.143 \
--allow-privileged=true \
--service-cluster-ip-range=10.0.0.0/24 \ #这里就用这个网段切记不要修改
--enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,ResourceQuota,NodeRestriction \
--authorization-mode=RBAC,Node \
--enable-bootstrap-token-auth \
--token-auth-file=/opt/kubernetes/cfg/token.csv \
--service-node-port-range=30000-50000 \
--tls-cert-file=/opt/kubernetes/ssl/server.pem \
--tls-private-key-file=/opt/kubernetes/ssl/server-key.pem \
--client-ca-file=/opt/kubernetes/ssl/ca.pem \
--service-account-key-file=/opt/kubernetes/ssl/ca-key.pem \
--etcd-cafile=/opt/etcd/ssl/ca.pem \
--etcd-certfile=/opt/etcd/ssl/server.pem \
--etcd-keyfile=/opt/etcd/ssl/server-key.pem"
```

```
参数说明：

* --logtostderr 启用⽇志 
* --v ⽇志等级 
* --etcd-servers etcd集群地址 
* --bind-address 监听地址 
* --secure-port https安全端⼝ 
* --advertise-address 集群通告地址 
* --allow-privileged 启用授权 
* --service-cluster-ip-range Service虚拟IP地址段 
* --enable-admission-plugins 准⼊控制模块 
* --authorization-mode 认证授权，启用RBAC授权和节点自管理 
* --enable-bootstrap-token-auth 启用TLS bootstrap功能，后面会讲到 
* --token-auth-file token文件 
* --service-node-port-range Service Node类型默认分配端⼝范围
```

4、systemd管理apiserver

```
cd /usr/lib/systemd/system
vim kube-apiserver.service

[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes

[Service]
EnvironmentFile=-/opt/kubernetes/cfg/kube-apiserver
ExecStart=/opt/kubernetes/bin/kube-apiserver $KUBE_APISERVER_OPTS
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```
systemctl daemon-reload
systemctl enable kube-apiserver
systemctl start kube-apiserver
systemctl status kube-apiserver
```

</details>

##### master节点部署schduler组件

<details>
<summary>master节点部署schduler组件</summary>

> 

1、创建schduler配置文件

```
vim /opt/kubernetes/cfg/kube-scheduler

KUBE_SCHEDULER_OPTS="--logtostderr=true \
--v=4 \
--master=127.0.0.1:8080 \
--leader-elect"
```

```
参数说明：
* --master 连接本地apiserver
* --leader-elect 当该组件启动多个时，自动选举（HA）
```

2、systemd管理schduler组件

```
cd /usr/lib/systemd/system/
vim kube-scheduler.service

[Unit]
Description=Kubernetes Scheduler
Documentation=https://github.com/kubernetes/kubernetes
[Service]
EnvironmentFile=/opt/kubernetes/cfg/kube-scheduler
ExecStart=/opt/kubernetes/bin/kube-scheduler $KUBE_SCHEDULER_OPTS
Restart=on-failure
[Install]
WantedBy=multi-user.target
```

3、启动

```
systemctl daemon-reload
systemctl enable kube-scheduler
systemctl start kube-scheduler
systemctl status kube-scheduler
```

</details>

##### master节点部署controller-manager组件

<details>
<summary>master节点部署controller-manager组件</summary>

> 

1、创建controller-manager配置文件

```
cd /opt/kubernetes/cfg/
vim kube-controller-manager

KUBE_CONTROLLER_MANAGER_OPTS="--logtostderr=true \
--v=4 \
--master=127.0.0.1:8080 \
--leader-elect=true \
--address=127.0.0.1 \
--service-cluster-ip-range=10.0.0.0/24 \	#这是后⾯dns要使用的虚拟网络，不用改，就用这个 切忌
--cluster-name=kubernetes \
--cluster-signing-cert-file=/opt/kubernetes/ssl/ca.pem \
--cluster-signing-key-file=/opt/kubernetes/ssl/ca-key.pem \
--root-ca-file=/opt/kubernetes/ssl/ca.pem \
--service-account-private-key-file=/opt/kubernetes/ssl/ca-key.pem"
```

2、systemd管理controller-manager组件

```
cd /usr/lib/systemd/system/
vim kube-controller-manager.service

[Unit]
Description=Kubernetes Controller Manager
Documentation=https://github.com/kubernetes/kubernetes
[Service]
EnvironmentFile=-/opt/kubernetes/cfg/kube-controller-manager
ExecStart=/opt/kubernetes/bin/kube-controller-manager $KUBE_CONTROLLER_MANAGER_OPTS
Restart=on-failure
[Install]
WantedBy=multi-user.target
```

3、启动

```
systemctl daemon-reload
systemctl enable kube-controller-manager
systemctl start kube-controller-manager
systemctl status kube-controller-manager.service
```

4、通过kubectl⼯具查看当前集群组件状态

```
[root@master system]# /opt/kubernetes/bin/kubectl get cs
```

效果示例：

```
NAME                 STATUS    MESSAGE              ERROR
controller-manager   Healthy   ok
scheduler            Healthy   ok
etcd-1               Healthy   {"health": "true"}
etcd-0               Healthy   {"health": "true"}
etcd-2               Healthy   {"health": "true"}
```

</details>

</details>

### 在Node节点部署组件

<details>
<summary>在Node节点部署组件</summary>

> 

#### 前置准备

<details>
<summary>前置准备</summary>

> 

**下面这些操作在master节点完成**

1、将kubelet-bootstrap用户绑定到系统集群⻆⾊

```
ln -s /opt/kubernetes/bin/kubectl  /usr/bin/kubectl
```

```
/opt/kubernetes/bin/kubectl create clusterrolebinding kubelet-bootstrap --clusterrole=system:node-bootstrapper --user=kubelet-bootstrap
```

2、创建kubeconfig文件

```
cd /opt/crt/
```

```
KUBE_APISERVER="https://192.168.209.143:6443" 
BOOTSTRAP_TOKEN=674c457d4dcf2eefe4920d7dbb6b0ddc

写你master的ip地址，集群中就写负载均衡的ip地址
```

3、设置集群参数

```
/opt/kubernetes/bin/kubectl config set-cluster kubernetes --certificate-authority=ca.pem --embed-certs=true --server=${KUBE_APISERVER}  --kubeconfig=bootstrap.kubeconfig
```

4、设置客户端认证参数

```
/opt/kubernetes/bin/kubectl config set-credentials kubelet-bootstrap --token=${BOOTSTRAP_TOKEN} --kubeconfig=bootstrap.kubeconfig
```

5、设置上下文参数

```
/opt/kubernetes/bin/kubectl config set-context default  --cluster=kubernetes  --user=kubelet-bootstrap --kubeconfig=bootstrap.kubeconfig
```

6、设置默认上下文

```
/opt/kubernetes/bin/kubectl config use-context default --kubeconfig=bootstrap.kubeconfig
```

7、创建kube-proxy kubeconfig文件

```
/opt/kubernetes/bin/kubectl config set-cluster kubernetes  --certificate-authority=ca.pem  --embed-certs=true  --server=${KUBE_APISERVER}  --kubeconfig=kube-proxy.kubeconfig
```

```
/opt/kubernetes/bin/kubectl config set-credentials kube-proxy  --client-certificate=kube-proxy.pem  --client-key=kube-proxy-key.pem  --embed-certs=true  --kubeconfig=kube-proxy.kubeconfig
```

```
/opt/kubernetes/bin/kubectl config set-context default --cluster=kubernetes --user=kube-proxy --kubeconfig=kube-proxy.kubeconfig
```

```
/opt/kubernetes/bin/kubectl config use-context default --kubeconfig=kube-proxy.kubeconfig
```

**效果示例：**

```
ls *.kubeconfig

bootstrap.kubeconfig kube-proxy.kubeconfig
```

8、将这两个 kubeconfig 文件拷贝到 Node 节点 /opt/kubernetes/cfg ⽬录下

```
scp *.kubeconfig k8s-node1:/opt/kubernetes/cfg/
```

</details>

#### 部署kubelet组件

<details>
<summary>部署kubelet组件</summary>

> 

1、将master中下载的二进制包中的kubelet和kube-proxy拷贝到node节点/opt/kubernetes/bin⽬录下

```
cd /root/kubernetes/server/bin/
scp kubelet kube-proxy k8s-node1:/opt/kubernetes/bin/
```

**下面这些操作在node节点完成**
2、创建kubelet配置文件

```
vim /opt/kubernetes/cfg/kubelet

KUBELET_OPTS="--logtostderr=true \
--v=4 \
--hostname-override=192.168.209.11 \	#每个节点自⼰的ip地址
--kubeconfig=/opt/kubernetes/cfg/kubelet.kubeconfig \
--bootstrap-kubeconfig=/opt/kubernetes/cfg/bootstrap.kubeconfig \
--config=/opt/kubernetes/cfg/kubelet.config \
--cert-dir=/opt/kubernetes/ssl \
--pod-infra-container-image=registry.cn-hangzhou.aliyuncs.com/google-containers/pause-amd64:3.0"	#这个镜像需要提前下载
```

```
下载镜像：
docker pull registry.cn-hangzhou.aliyuncs.com/google-containers/pause-amd64:3.0
```

```
参数说明：
--hostname-override 在集群中显示的主机名
--kubeconfig 指定kubeconfig文件位置，会自动生成
--bootstrap-kubeconfig 指定刚才生成的bootstrap.kubeconfig文件
--cert-dir 颁发证书存放位置
--pod-infra-container-image 管理Pod网络的镜像
```

3、kubelet.config配置

> /opt/kubernetes/cfg/kubelet.config配置

```
vim /opt/kubernetes/cfg/kubelet.config

kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
address: 192.168.209.11 #写你机器的ip地址
port: 10250
readOnlyPort: 10255
cgroupDriver: cgroupfs
clusterDNS: ["10.0.0.2"] #不要改，就是这个ip地址
clusterDomain: cluster.local.
failSwapOn: false
authentication:
anonymous:
enabled: true
webhook:
enabled: false
```

4、systemd管理kubelet组件

```
vim /usr/lib/systemd/system/kubelet.service

[Unit]
Description=Kubernetes Kubelet
After=docker.service
Requires=docker.service
[Service]
EnvironmentFile=/opt/kubernetes/cfg/kubelet
ExecStart=/opt/kubernetes/bin/kubelet $KUBELET_OPTS
Restart=on-failure
KillMode=process
[Install]
WantedBy=multi-user.target
```

5、启动kubelet

```
systemctl daemon-reload
systemctl enable kubelet
systemctl start kubelet
```

6、查看申请加入集群的节点

```
/opt/kubernetes/bin/kubectl get csr

NAME                                                   AGE       REQUESTOR           CONDITION
node-csr-3Qm5ndW4_aKjhhWSKhLhSfGw_tq04C6pkTG0gEDLpJ0   11s       kubelet-bootstrap   Pending
node-csr-ldXf2ozPyVVGz8Hs5ND8njKmbQ7kFO5nvVitVPgAKIA   7m        kubelet-bootstrap   Pending
```

7、master审批通过允许加入集群

> 启动后还没加⼊到集群中，需要手动允许该节点才可以。在Master节点查看请求签名的Node

```
/opt/kubernetes/bin/kubectl certificate approve XXXXID

xxxid 指的是上一步的NAME这⼀列
```

8、再次检查证书签名状态

```
/opt/kubernetes/bin/kubectl get csr

NAME                                                   AGE       REQUESTOR           CONDITION
node-csr-3Qm5ndW4_aKjhhWSKhLhSfGw_tq04C6pkTG0gEDLpJ0   3m        kubelet-bootstrap   Approved,Issued
node-csr-ldXf2ozPyVVGz8Hs5ND8njKmbQ7kFO5nvVitVPgAKIA   10m       kubelet-bootstrap   Approved,Issued

输出中可以看到，两个证书签名请求（CSR）的状态都已经变为 Approved,Issued。这意味着这些 CSR 不仅已经被批准，而且相应的证书也已经被签发并可以供节点使用。

现在，可以检查相应的节点是否已经成功加入到 Kubernetes 集群中，并且状态是否为 Ready。使用以下命令来查看集群中的节点状态：
```

9、查看集群节点信息

```
/opt/kubernetes/bin/kubectl get node

NAME             STATUS    ROLES     AGE       VERSION
192.168.209.11   Ready     <none>    3m        v1.11.10
192.168.209.12   Ready     <none>    3m        v1.11.10
```

</details>

#### 部署kube-proxy组件

<details>
<summary>部署kube-proxy组件</summary>

> 

**在所有node节点进行**

1、创建kube-proxy配置文件

```
vim /opt/kubernetes/cfg/kube-proxy

KUBE_PROXY_OPTS="--logtostderr=true \
--v=4 \
--hostname-override=192.168.209.143 \	#写每个node节点ip
--cluster-cidr=10.0.0.0/24 \	#不要改，就是这个ip
--kubeconfig=/opt/kubernetes/cfg/kube-proxy.kubeconfig"
```

2、systemd管理kube-proxy组件

```
cd /usr/lib/systemd/system
vim  /usr/lib/systemd/system/kube-proxy.service

[Unit]
Description=Kubernetes Proxy
After=network.target
[Service]
EnvironmentFile=-/opt/kubernetes/cfg/kube-proxy
ExecStart=/opt/kubernetes/bin/kube-proxy $KUBE_PROXY_OPTS
Restart=on-failure
[Install]
WantedBy=multi-user.target
```

3、启动

```
systemctl daemon-reload
systemctl enable kube-proxy
systemctl start kube-proxy
```

4、在master查看集群状态

```
/opt/kubernetes/bin/kubectl get node

NAME             STATUS    ROLES     AGE       VERSION
192.168.209.11   Ready     <none>    5h        v1.11.10
192.168.209.12   Ready     <none>    5h        v1.11.10
```

5、查看集群组件的状态

```
opt/kubernetes/bin/kubectl get cs

NAME                 STATUS    MESSAGE              ERROR
controller-manager   Healthy   ok
scheduler            Healthy   ok
etcd-1               Healthy   {"health": "true"}
etcd-2               Healthy   {"health": "true"}
etcd-0               Healthy   {"health": "true"}
```

</details>

#### 部署Dashboard（Web UI）

<details>
<summary>部署Dashboard（Web UI）</summary>

> 

1、部署Pod，提供Web服务

```
mkdir webui
cd webui/
vim dashboard-deployment.yaml

apiVersion: apps/v1beta2
kind: Deployment
metadata:
  name: kubernetes-dashboard
  namespace: kube-system
  labels:
    k8s-app: kubernetes-dashboard
    kubernetes.io/cluster-service: "true"
    addonmanager.kubernetes.io/mode: Reconcile
spec:
  selector:
    matchLabels:
      k8s-app: kubernetes-dashboard
  template:
    metadata:
      labels:
        k8s-app: kubernetes-dashboard
      annotations:
        scheduler.alpha.kubernetes.io/critical-pod: ''
    spec:
      serviceAccountName: kubernetes-dashboard
      containers:
        - name: kubernetes-dashboard
          image: registry.cn-hangzhou.aliyuncs.com/kube_containers/kubernetes-dashboard-amd64:v1.8.1
          resources:
            limits:
              cpu: 100m
              memory: 300Mi
            requests:
              cpu: 100m
              memory: 100Mi
          ports:
            - containerPort: 9090
              protocol: TCP
          livenessProbe:
            httpGet:
              scheme: HTTP
              path: /
              port: 9090
            initialDelaySeconds: 30
            timeoutSeconds: 30
      tolerations:
        - key: "CriticalAddonsOnly"
          operator: "Exists"
```

2、授权访问apiserver获取信息

```
vim dashboard-rbac.yaml

apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: kubernetes-dashboard
    addonmanager.kubernetes.io/mode: Reconcile
  name: kubernetes-dashboard
  namespace: kube-system

---

kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: kubernetes-dashboard-minimal
  namespace: kube-system
  labels:
    k8s-app: kubernetes-dashboard
    addonmanager.kubernetes.io/mode: Reconcile
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: kubernetes-dashboard
    namespace: kube-system
[root@k8s-master webui]# cat dashboard-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: kubernetes-dashboard
  namespace: kube-system
  labels:
    k8s-app: kubernetes-dashboard
    kubernetes.io/cluster-service: "true"
    addonmanager.kubernetes.io/mode: Reconcile
spec:
  type: NodePort
  selector:
    k8s-app: kubernetes-dashboard
  ports:
    - port: 80
      targetPort: 9090
```

3、发布服务，提供对外访问

```
/opt/kubernetes/bin/kubectl create -f dashboard-rbac.yaml
/opt/kubernetes/bin/kubectl create -f dashboard-deployment.yaml
/opt/kubernetes/bin/kubectl create -f dashboard-service.yaml
```

4、等待数分钟，查看资源状态，查看名称空间

```
/opt/kubernetes/bin/kubectl get all -n kube-system

NAME READY STATUS RESTARTS 
 AGE
pod/kubernetes-dashboard-d9545b947-442ft 1/1 Running 0 
 21m
NAME TYPE CLUSTER-IP EXTERNAL-IP PORT
(S) AGE
service/kubernetes-dashboard NodePort 10.0.0.143 <none> 80:4
7520/TCP 21m
NAME DESIRED CURRENT UP-TO-DATE A
VAILABLE AGE
deployment.apps/kubernetes-dashboard 1 1 1 1
 21m
NAME DESIRED CURRENT READ
Y AGE
replicaset.apps/kubernetes-dashboard-d9545b947 1 1 1 
 21m
```

5、查看访问端⼝，查看指定命名空间的服务

```
/opt/kubernetes/bin/kubectl get svc -n kube-system

NAME                   TYPE       CLUSTER-IP   EXTERNAL-IP   PORT(S)        AGE
kubernetes-dashboard   NodePort   10.0.0.125   <none>        80:48876/TCP   2m
```

6、测试

```
运行⼀个测试示例--在master节点先安装docker服务
创建⼀个Nginx Web，判断集群是否正常
/opt/kubernetes/bin/kubectl run nginx --image=daocloud.io/nginx --replicas=3
/opt/kubernetes/bin/kubectl expose deployment nginx --port=88 --target-port=80 --type=NodePort
/opt/kubernetes/bin/kubectl delete -f deployment --all
在master上面查看：
查看Pod，Service：
/opt/kubernetes/bin/kubectl get pods #需要等⼀会

NAME READY STATUS RESTARTS AGE
nginx-64f497f8fd-fjgt2 1/1 Running 3 28d
nginx-64f497f8fd-gmstq 1/1 Running 3 28d
nginx-64f497f8fd-q6wk9 1/1 Running 3 28d

查看pod详细信息：
/opt/kubernetes/bin/kubectl describe pod nginx-64f497f8fd-fjgt2
/opt/kubernetes/bin/kubectl get svc

NAME TYPE CLUSTER-IP EXTERNAL-IP PORT(S) 
 AGE
kubernetes ClusterIP 10.0.0.1 <none> 443/TCP 
 28d
nginx NodePort 10.0.0.175 <none> 88:38696/TCP 
 28d

访问nodeip加端⼝
打开浏览器输⼊：http://192.168.209.11:38696
恭喜你，集群部署成功！
```

</details>

</details>

</details>

### kuberadm方式部署Kubernetes

<details>
<summary>kuberadm方式部署Kubernetes</summary>

> 

0、配置yum源

```
cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
```

1、获取镜像

> 这里部署k8sv1.19.1版本
> 所有节点都必须有镜像

#### 在所有节点安装kubeadm和kubelet、kubectl

<details>
<summary>在所有节点安装kubeadm和kubelet、kubectlKubernetes</summary>

> 

1、下载1.19.1版本

```
yum install -y kubelet-1.19.1-0.x86_64 kubeadm-1.19.1-0.x86_64 kubectl-1.19.1-0.x86_64 ipvsadm
```

2、加载ipvs相关内核模块

```
modprobe ip_vs && modprobe ip_vs_rr && modprobe ip_vs_wrr && modprobe ip_vs_sh && modprobe nf_conntrack_ipv4
```

3、编辑文件添加开机启动

```
modprobe ip_vs
modprobe ip_vs_rr
modprobe ip_vs_wrr
modprobe ip_vs_sh
modprobe nf_conntrack_ipv4
chmod +x /etc/rc.local
```

4、配置转发相关参数，否则可能会出错

```
cat <<EOF > /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
vm.swappiness=0
EOF
```

5、使配置生效

```
sysctl --system
```

6、如果net.bridge.bridge-nf-call-iptables报错，加载br_netfilter模块

```
modprobe br_netfilter
sysctl -p /etc/sysctl.d/k8s.conf
```

7、查看是否加载成功

```
lsmod | grep ip_vs
```

</details>

#### 所有主机配置启动kubelet

<details>
<summary>所有主机配置启动kubelet</summary>

> 

1、配置kubelet使用pause镜像

```
DOCKER_CGROUPS=`docker info|grep "Cgroup Driver"|awk '{print $3}'`

获取docker的驱动cgroups（linux提供的资源隔离限制）
设置变量DOCKER_CGROUPS 等于  docker驱动cgroups的值
```

2、配置kubelet的cgroups

```
阿里云的pause镜像
cat >/etc/sysconfig/kubelet<<EOF
KUBELET_EXTRA_ARGS="--cgroup-driver=$DOCKER_CGROUPS --pod-infra-container-image=registry.cn-hangzhou.aliyuncs.com/google_containers/pause-amd64:3.2"
EOF


或者 k8s官网的pause镜像
cat >/etc/sysconfig/kubelet<<EOF
KUBELET_EXTRA_ARGS="--cgroup-driver=$DOCKER_CGROUPS --pod-infra-container-image=k8s.gcr.io/pause:3.2"
EOF


或者直接用没有变量名，直接给cgroup值的
cat >/etc/sysconfig/kubelet<<EOF
KUBELET_EXTRA_ARGS="--cgroup-driver=cgroupfs --pod-infra-container-image=k8s.gcr.io/pause:3.2"
EOF
```

3、启动kubelet

```
systemctl daemon-reload
systemctl enable kubelet && systemctl restart kubelet
systemctl status kubelet

错误是正常现象，因为api-server还没有在master节点上初始化启动
报错误信息：
10⽉ 11 00:26:43 node1 systemd[1]: kubelet.service: main process exited, c
ode=exited, status=255/n/a
10⽉ 11 00:26:43 node1 systemd[1]: Unit kubelet.service entered failed sta
te.
10⽉ 11 00:26:43 node1 systemd[1]: kubelet.service failed.
运行 # journalctl -xefu kubelet 命令查看systemd⽇志才发现，真正的错误是：
 unable to load client CA file /etc/kubernetes/pki/ca.crt: open /etc/ku
bernetes/pki/ca.crt: no such file or directory
这个错误在运⾏kubeadm init 生成CA证书后会被自动解决，此处可先忽略。
简单地说就是在kubeadm init 之前kubelet会不断重启。
```

</details>

#### master节点初始化

<details>
<summary>master节点初始化</summary>

> 

1、初始化

```
kubeadm init --kubernetes-version=v1.19.1 --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=192.168.229.11 --ignore-preflight-errors=Swap

apiserver-advertise-address=192.168.229.11 master的ip地址。
--kubernetes-version=v1.19.1 --更具具体版本进行修改
--pod-network-cidr=10.244.0.0/16 我们自定义pod给容器内指定的网段
--ignore-preflight-errors=Swap   忽略swap分区错误（我们已经关闭了swap，此处有没有都可以）
注意在检查⼀下swap分区是否关闭
一回车，就会自动的帮我们准备master运行所需要的组件，从k8s官网下载
```

2、在初始化的时候指定镜像源

```
kubeadm reset
kubeadm init --kubernetes-version=v1.19.1 --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=192.168.229.11 --ignore-preflight-errors=Swap --image-repository=registry.aliyuncs.com/google_containers
```

**镜像准备好之后，再次进行初始化，依然拉取失败**

![image](https://github.com/user-attachments/assets/9d51e27a-3924-48e0-87af-7065cde4739a)

```
vim dockerPullv1.19.1.sh

#!/bin/bash
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-controller-manager:v1.19.1
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-proxy:v1.19.1
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-apiserver:v1.19.1
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-scheduler:v1.19.1
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:1.7.0
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.4.13-0
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.2
```

重新打tag

> 下载完了之后需要将阿里云下载下来的所有镜像打成k8s.gcr.io/kube-controller-manage
> r:v1.19.1这样的tag

```
vim tagv1.19.1.sh

#!/bin/bash
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-controller-manager:v1.19.1 k8s.gcr.io/kube-controller-manager:v1.19.1
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-proxy:v1.19.1 k8s.gcr.io/kube-proxy:v1.19.1
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-apiserver:v1.19.1 k8s.gcr.io/kube-apiserver:v1.19.1
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-scheduler:v1.19.1 k8s.gcr.io/kube-scheduler:v1.19.1
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:1.7.0 k8s.gcr.io/coredns:1.7.0
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.4.13-0 k8s.gcr.io/etcd:3.4.13-0
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.2 k8s.gcr.io/pause:3.2
```

3、执行脚本

```
chmod +x *.sh
bash dockerPullv1.19.1.sh
bash tagv1.19.1.sh
```

4、Mater重新完成初始化

```
kubeadm reset
kubeadm init --kubernetes-version=v1.19.1 --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=192.168.229.11 --ignore-preflight-errors=Swap
```

5、执行Master初始化后的提示配置

```
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config
```

6、查看node节点

```
kubectl get nodes

NAME STATUS ROLES AGE VERSION
k8s-master NotReady master 2m41s v1.17.4
```

</details>

#### 配置使用网络插件

<details>
<summary>配置使用网络插件</summary>

> 

1、用这个网络插件的配置文件kube-flannelv1.19.1.yaml

```
---
kind: Namespace
apiVersion: v1
metadata:
  name: kube-flannel
  labels:
    k8s-app: flannel
    pod-security.kubernetes.io/enforce: privileged
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  labels:
    k8s-app: flannel
  name: flannel
rules:
- apiGroups:
  - ""
  resources:
  - pods
  verbs:
  - get
- apiGroups:
  - ""
  resources:
  - nodes
  verbs:
  - get
  - list
  - watch
- apiGroups:
  - ""
  resources:
  - nodes/status
  verbs:
  - patch
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  labels:
    k8s-app: flannel
  name: flannel
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: flannel
subjects:
- kind: ServiceAccount
  name: flannel
  namespace: kube-flannel
---
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: flannel
  name: flannel
  namespace: kube-flannel
---
kind: ConfigMap
apiVersion: v1
metadata:
  name: kube-flannel-cfg
  namespace: kube-flannel
  labels:
    tier: node
    k8s-app: flannel
    app: flannel
data:
  cni-conf.json: |
    {
      "name": "cbr0",
      "cniVersion": "0.3.1",
      "plugins": [
        {
          "type": "flannel",
          "delegate": {
            "hairpinMode": true,
            "isDefaultGateway": true
          }
        },
        {
          "type": "portmap",
          "capabilities": {
            "portMappings": true
          }
        }
      ]
    }
  net-conf.json: |
    {
      "Network": "10.244.0.0/16",
      "EnableNFTables": false,
      "Backend": {
        "Type": "vxlan"
      }
    }
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds
  namespace: kube-flannel
  labels:
    tier: node
    app: flannel
    k8s-app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/os
                operator: In
                values:
                - linux
      hostNetwork: true
      priorityClassName: system-node-critical
      tolerations:
      - operator: Exists
        effect: NoSchedule
      - key: node.kubernetes.io/not-ready
        operator: Exists
        effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
      - name: install-cni-plugin
        image: docker.io/flannel/flannel-cni-plugin:v1.5.1-flannel2
        command:
        - cp
        args:
        - -f
        - /flannel
        - /opt/cni/bin/flannel
        volumeMounts:
        - name: cni-plugin
          mountPath: /opt/cni/bin
      - name: install-cni
        image: docker.io/flannel/flannel:v0.25.6
        command:
        - cp
        args:
        - -f
        - /etc/kube-flannel/cni-conf.json
        - /etc/cni/net.d/10-flannel.conflist
        volumeMounts:
        - name: cni
          mountPath: /etc/cni/net.d
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
      containers:
      - name: kube-flannel
        image: docker.io/flannel/flannel:v0.25.6
        command:
        - /opt/bin/flanneld
        args:
        - --ip-masq
        - --iface=ens33
        - --kube-subnet-mgr
        resources:
          requests:
            cpu: "100m"
            memory: "50Mi"
        securityContext:
          privileged: false
          capabilities:
            add: ["NET_ADMIN", "NET_RAW"]
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: EVENT_QUEUE_DEPTH
          value: "5000"
        volumeMounts:
        - name: run
          mountPath: /run/flannel
        - name: flannel-cfg
          mountPath: /etc/kube-flannel/
        - name: xtables-lock
          mountPath: /run/xtables.lock
      volumes:
      - name: run
        hostPath:
          path: /run/flannel
      - name: cni-plugin
        hostPath:
          path: /opt/cni/bin
      - name: cni
        hostPath:
          path: /etc/cni/net.d
      - name: flannel-cfg
        configMap:
          name: kube-flannel-cfg
      - name: xtables-lock
        hostPath:
          path: /run/xtables.lock
          type: FileOrCreate
```

2、创建flannel网络

```
kubectl apply -f kube-flannelv1.19.1.yaml
kubectl get pod -n kube-system
```

3、查看哪一个pod被分配到哪一个节点

```
kubectl get pod -n kube-system -o wide 

NAME                             READY   STATUS    RESTARTS   AGE   IP               NODE     NOMINATED NODE   READINESS GATES
coredns-f9fd979d6-58xgh          1/1     Running   0          91m   10.244.0.2       master   <none>           <none>
coredns-f9fd979d6-pj6rb          1/1     Running   0          82m   10.244.0.3       master   <none>           <none>
etcd-master                      1/1     Running   0          92m   192.168.229.11   master   <none>           <none>
kube-apiserver-master            1/1     Running   4          92m   192.168.229.11   master   <none>           <none>
kube-controller-manager-master   1/1     Running   15         92m   192.168.229.11   master   <none>           <none>
kube-proxy-sb5zd                 1/1     Running   0          91m   192.168.229.11   master   <none>           <none>
kube-scheduler-master            1/1     Running   16         92m   192.168.229.11   master   <none>           <none>
```

4、获取节点

```
kubectl get node

NAME     STATUS   ROLES    AGE   VERSION
master   Ready    master   94m   v1.19.1
```

</details>

#### 所有node节点加⼊集群

<details>
<summary>所有node节点加⼊集群</summary>

> 

1、配置node节点加⼊集群，如果报错开启ip转发

```
sysctl -w net.ipv4.ip_forward=1
```

```
在所有node节点操作，此命令为初始化master成功后返回的结果
kubeadm join 192.168.229.11:6443 --token 2eo635.zefoh7sqrndzdju6  --discovery-token-ca-cert-hash sha256:20fe16459d5d0f79025be51f7a800af01f7aa1fb5bd3e33b4eb37328facaff07
```

```
如果加入时显示端口占用，再次 kubeadm reset 即可

加入后master一直显示noready，对应的节点 systemctl restart kubelet
```

</details>

</details>

## 集群操作

<details>
<summary>集群操作</summary>

> 

### 查看集群信息

<details>
<summary>查看集群信息</summary>

> 

查看集群信息

```
kubectl get nodes
```

删除节点（⽆效且显示的也可以删除）

> 后期如果 要删除某个节点，为了不增加其他节点的访问压力，先增加一个节点，再删除要删除的节点

```
语法：kubect	delete node 节点名
kubectl delete node k8s-node2
```

```
如果删除后，该节点需要再次加入集群，在master重置token,打印加入的命令
kubeadm token create --print-join-command

拿着打印的命令，再要加入的node节点执行
kubeadm join 192.168.229.11:6443 --token 7saaxa.nc2nvxlwfdzcash2     --discovery-token-ca-cert-hash sha256:f424d840e5699375bb039cbc72e7700ec9234ae0c3be10c4a665ac545c26c5bf
```

单独查看某⼀个节点(节点名称可以用空格隔开写多个)

```
kubectl get node k8s-node1
```

查看node的详细信息

```
kubectl describe node k8s-node1

Name: k8s-node1
Roles: <none>
...
 -------- -------- ------
 Allocated resources:
  (Total limits may be over 100 percent, i.e., overcommitted.)
  Resource           Requests    Limits
  --------           --------    ------
  cpu                200m (10%)  100m (5%)
  memory             100Mi (2%)  50Mi (1%)
  ephemeral-storage  0 (0%)      0 (0%)
  hugepages-1Gi      0 (0%)      0 (0%)
  hugepages-2Mi      0 (0%)      0 (0%)

#注意:最后被查看的节点名称只能用get nodes⾥⾯查到的name!


cpu

Requests: 200m (10%) — 表示容器请求的 CPU 资源为 200 毫核（milli-cores），即 0.2 个核心，占据了总 CPU 资源的 10%。
Limits: 100m (5%) — 表示容器的 CPU 限制为 100 毫核，即 0.1 个核心，占据了总 CPU 资源的 5%。
memory

Requests: 100Mi (2%) — 表示容器请求的内存资源为 100 MiB，占据了总内存资源的 2%。
Limits: 50Mi (1%) — 表示容器的内存限制为 50 MiB，占据了总内存资源的 1%。
ephemeral-storage

Requests: 0 (0%) — 表示容器请求的临时存储资源为 0。
Limits: 0 (0%) — 表示容器的临时存储限制为 0。
hugepages-1Gi

解释
Requests 是容器启动时 Kubernetes 调度器用来决定节点上可用资源的基础。它代表了容器正常运行所需的最低资源量。
Limits 是容器可以使用的最大资源量。超出这个限制，容器可能会被限制或终止。
```

查看各组件信息

```
service的信息：
kubectl get service

NAME TYPE CLUSTER-IP EXTERNAL-IP PORT(S) AGE
kubernetes ClusterIP 10.96.0.1 <none> 443/TCP 19h

NAME: kubernetes — 这是服务的名称。
TYPE: ClusterIP — 这是服务的类型。ClusterIP 类型的服务只能在集群内部访问，无法从外部直接访问。
CLUSTER-IP: 10.96.0.1 — 这是服务在集群内部的虚拟 IP 地址。它用于将流量路由到服务后端的 Pods。
EXTERNAL-IP: <none> — 这个字段显示为 <none>，意味着该服务没有配置外部 IP，也就是说，外部网络不能直接访问这个服务。ClusterIP 类型的服务默认没有外部 IP。
PORT(S): 443/TCP — 这是服务监听的端口和协议。这里是 TCP 协议的 443 端口。
AGE: 19h — 这是服务创建的时间，从创建到现在已经过去了 19 小时。
```

在不同的namespace⾥⾯查看service

```
kubectl get service -n kube-system -n:namespace
```

查看所有名称空间内的资源

```
kubectl get pods --all-namespaces
```

同时查看多种资源信息

```
kubectl get pod,service -n kube-system
```

查看主节点

```
kubectl cluster-info
```

api查询

```
kubectl api-versions
```

- 创建名称空间

编写yaml文件

```
vim namespace.yaml

--- # yaml开始的标记
apiVersion: v1 #api版本
kind: Namespace #类型---固定的
metadata: #元数据
name: ns-monitor #给命名空间起个名字
labels: #用于给这个 Namespace 添加标签。标签是键值对，可以用于标识、组织和选择资源
name: ns-monitor  # 该namespace的标签

=======================================================

---

apiVersion: v1
kind: Namespace
metadata:
name: ns-monitor
labels:
name: monitor_hah_lale
```

创建资源

```
kubectl apply -f namespace.yml
namespace/ns-monitor created
```

查看资源

```
kubectl get namespace
```

查看某⼀个namespace

```
kubectl get namespace ns-monitor
```

根据标签名查询命名空间

```
kubectl get namespaces --selector=name=monitor_hah_lale
```

查看某个namespace的详细信息

```
kubectl describe namespace ns-monitor
```

修改名称空间的名字

```
不能直接修改，删除原有的命名空间，创建新的命名空间
kubectl create namespace new-namespace-name

删除老的命名空间
kubectl delete namespace ns-monitor

或者 修改yml文件，重新创建
---
apiVersion: v1
kind: Namespace
metadata:
  name: ns-monitor1  # 从ns-monitor 改为 ns-monitor1
  labels:
    name: monitor_hah_lale
```

删除名称空间

```
kubectl delete -f namespace.yml
kubectl delete namespace ns-monitor
```

</details>

### 发布第⼀个容器化应用

<details>
<summary>发布第⼀个容器化应用</summary>

> 

> 说明
> 
> 1. 有镜像
> 2. 部署应用。考虑做不做副本不做副本就是pod，做副本以deployment/RC/DaemonSet⽅式去创建。做了副本访问还需要做⼀>个service，使用访问。
> 3. 作为⼀个应用开发者，⾸先要做的，是制作容器的镜像。
> 4. 有了容器镜像之后，需要按照 Kubernetes 项⽬的规范和要求，将你的镜像组织为它能够"认识"的⽅式，然后提交上去。
>    什么才是 Kubernetes 项⽬能"认识"的⽅式？
> 
> - 就是使用 Kubernetes 的必备技能：编写配置文件。
> - 这些配置文件可以是 YAML 或者 JSON 格式的。
>   Kubernetes 跟 Docker 等很多项⽬最⼤的不同，就在于它不推荐你使用命令⾏的⽅式直接运⾏容器（虽然 Kubernetes 项⽬也⽀持这种⽅式，⽐如：kubectl run），⽽是希望你用 YAML 文件的⽅式，
>   即：把容器的定义、参数、配置，统统记录在⼀个 YAML 文件中，然后用这样⼀句指令把它运⾏起来：

```
kubectl create/apply -f 我的配置文件
```
> 第一创还能create和apply没有什么区别
> 如果第二次创建，修改了yml,apply会更新创建的内容

**编写yaml文件内容如下**

```
vim pod.yml

---
apiVersion: v1 #api版本，⽀持pod的版本
kind: Pod      #Pod，定义类型注意语法开头⼤写
metadata: #元数据
  name: website  #这是pod的名字
  labels:
    name: website_name_pod #⾃定义键值可以是任意内容，但是不能是纯数字
spec: #属性
  containers:  #定义容器
    - name: test-website #容器的名字，可以⾃定义
      #镜像 可以是仓库地址 也可以是本地镜像名称 如nginx:latest
      image: hub.atomgit.com/amd64/nginx:1.25.2-perl 
      ports:
      - containerPort: 80 #容器暴露的端⼝
```

创建pod

```
kubectl apply -f pod.yml
pod/website created
```

查看pod

```
kubectl get pods

NAME READY STATUS RESTARTS AGE
website 1/1 Running 0 74s
==========================================================================
各字段含义：
NAME: Pod的名称
READY: Pod的准备状况，右边的数字表示Pod包含的容器总数⽬，左边的数字表示准备就绪的容器
数⽬
STATUS: Pod的状态
RESTARTS: Pod的重启次数
AGE: Pod的运⾏时间
```

查看pod运⾏在哪台机器上

```
kubectl get pods -o wide
```

查看pods定义的详细信息

```
kubectl get pod website -o yaml -n default -o：output
```

查看kubectl describe ⽀持查询Pod的状态和⽣命周期事件

```
kubectl describe pod website
```

```
1.各字段含义：
Name: Pod的名称
Namespace: Pod的Namespace。
Image(s): Pod使用的镜像
Node: Pod所在的Node。
Start Time: Pod的起始时间
Labels: Pod的Label。
Status: Pod的状态。
Reason: Pod处于当前状态的原因。
Message: Pod处于当前状态的信息。
IP: Pod的PodIP
Replication Controllers: Pod对应的Replication Controller。
===============================
2.Containers:Pod中容器的信息
Container ID: 容器的ID
Image: 容器的镜像
Image ID:镜像的ID
State: 容器的状态
Ready: 容器的准备状况(true表示准备就绪)。
Restart Count: 容器的重启次数统计
Environment Variables: 容器的环境变量
Conditions: Pod的条件，包含Pod准备状况(true表示准备就绪)
Volumes: Pod的数据卷
Events: 与Pod相关的事件列表
=====
⽣命周期：指的是status通过# kubectl get pod
⽣命周期包括：running、Pending、completed、
```

进⼊Pod对应的容器内部

```
kubectl exec -it website /bin/bash
```

删除pod

```
kubectl delete pod pod名1 pod名2	#单个或多个删除
kubectl delete pod --all	#批量删除,删除所有的pod
```

创建pod

```
kubectl apply -f pod.yaml #指定创建pod的yml文件名
kubectl apply -f pod.yaml --validate #想看报错信息，加上--validate参数
```

重新启动基于yaml文件的应用(这⾥并不是重新启动服务)

```
kubectl delete -f XXX.yaml #删除
kubectl apply -f XXX.yaml #创建
```

</details>

### 投射数据卷 Projected Volume

<details>
<summary>投射数据卷 Projected Volume</summary>

> 

#### Secret

<details>
<summary>创建⾃⼰的Secret</summary>

> 

> ⽅式1：使用kubectl create secret命令
> ⽅式2：yaml文件创建Secret

##### 命令⽅式创建secret

> 假如某个Pod要访问数据库，需要用户名密码，分别存放在2个文件中：username.txt，password.txt

```
echo -n 'admin' > ./username.txt
echo -n "sunyaowei1" > password.txt
```

```
kubectl create secret generic db-user-pass --from-file=./username.txt --from-file=./password.txt

创建一个名为db-user-pass的secret ，里面引入的有username.txt 和password.txt
```
查看创建结果

```
kubectl get secret

NAME                  TYPE                                  DATA   AGE
db-user-pass          Opaque                                2      15s
```
查看详细信息

```
kubectl describe secret db-user-pass

Name:         db-user-pass
Namespace:    default
Labels:       <none>
Annotations:  <none>

Type:  Opaque

Data
====
password.txt:  10 bytes
username.txt:  5 bytes
```

> describe指令不会展示secret的实际内容，这是出于对数据的保护的考虑，如果想查看实际内容使用命令：

```
kubectl get secret db-user-pass -o yaml
```

通过字面数据创建secret

```
kubectl create secret generic mysecret \
  --from-literal=name=aglarevv\
  --from-literal=password=123
```

```
kubectl get secret mysecret -o yaml
kubectl describe secret mysecret
```

##### yaml⽅式创建Secret

创建⼀个secret.yaml文件，内容用base64编码:明文显示容易被别⼈发现，这⾥先转码

```
cho -n 'admin' | base64
echo -n '123456' | base64
```

创建⼀个secret.yaml文件，内容用base64编码

```
vim secret.yml

---
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque #模糊
data:
  username: YWRtaW4=
  password: MTIzNDU2
```

```
kubectl apply -f secret.yml secret/mysecret created
```

查看创建的secret

```
kubectl get secret

NAME                  TYPE                                  DATA   AGE
db-user-pass          Opaque                                2      38m
default-token-stcpf   kubernetes.io/service-account-token   3      25h
mysecret              Opaque                                2      54s
```

解析Secret中内容,还是经过编码的---需要解码

```
kubectl get secret mysecret -o yaml

apiVersion: v1
data:
  password: MTIzNDU2
  username: YWRtaW4=
```

```
解码：
echo -n "MTIzNDU2" |base64 --decode
echo -n "YWRtaW4=" |base64 --decode
```

</details>

#### 使用Secret

<details>
<summary>使用Secret</summary>

> 

> 可以把比较敏感的数据创建在secret中
> 创建的时候都是加密的数据，来到容器后，自动解密
> 弊端：
> ​会把整个数据卷的secret映射到指定目录中，
> 如果只想映射secret中的某一个数据，就需要用到映射secret key的方式

##### ⼀个Pod中引用Secret的例⼦

1、创建一个pod

```
vim pod_use_secret.yaml

apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: nginx
    image: nginx
    volumeMounts: #数据卷挂载
      - name: foo # 挂载名为foo的数据卷
        mountPath: "/root/" #挂载到容器的/root/目录下
        readOnly: true #挂载的数据只读
  volumes: #数据卷的定义
  - name: foo #卷的名字这个名字自定义
    secret: #卷是直接使用的secret。
      secretName: mysecret #调用刚才定义的secret
```

```
kubectl apply -f pod_use_secret.yaml
```

2、查看pod

```
kubectl get pod

NAME    READY   STATUS    RESTARTS   AGE
mypod   1/1     Running   0          87s
```

3、进入到mypod，查看/root/

```
[root@k8s-master prome]# kubectl exec -it mypod /bin/bash
root@mypod:/# ls /root/
password  username
root@mypod:/# cat /root/password
123456
root@mypod:/# cat /root/username
adminroot
```

##### 映射secret key到指定的路径

1、清除mypod

```
kubectl get pod

NAME    READY   STATUS    RESTARTS   AGE
mypod   1/1     Running   0          7m47s
```

2、修改

```
vim pod_use_secret.yaml

apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: nginx
    image: nginx
    volumeMounts: #数据卷挂载
      - name: foo # 挂载名为foo的数据卷
        mountPath: "/root/" #挂载到容器的/root/目录下
        readOnly: true #挂载的数据只读
  volumes: #数据卷的定义
  - name: foo #卷的名字这个名字自定义
    secret: #卷是直接使用的secret。
      secretName: mysecret #调用刚才定义的secret
      items: #定义一个选项，即选择mysecret数据中的部分键
      - key: username # 指定映射的键
        path: my_dir/my_username # 映射到挂载容器目录下 /my_dir/my_username
```

```
kubectl apply -f pod_use_secret.yaml
```

3、查看pod

```
kubectl get  pod

NAME    READY   STATUS    RESTARTS   AGE
mypod   1/1     Running   0          38s
```

4、进入pod，并查看文件

```
[root@k8s-master prome]# kubectl exec -it mypod /bin/bash
kubectl exec [POD] [COMMAND] is DEPRECATED and will be removed in a future version. Use kubectl exec [POD] -- [COMMAND] instead.
root@mypod:/# pwd
/
root@mypod:/# ls /root/
my_dir
root@mypod:/# ls /root/my_dir
my_username
root@mypod:/# cat /root/my_dir/my_username
admin
```

##### 被挂载的secret内容自动更新

1、设置base64加密

```
echo -n "sunyaowei" | base64
```

2、将admin替换成sunyaowei

```
vim secret.yml

---
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  username: YWRtaW4=
  password: Y2hlbmZ1Z3Vv #将admin 替换为sunyaowei加密后的数据
```

3、创建

```
kubectl apply -f secret.yml
```

4、连接pod容器

```
[root@kub-k8s-master prome]# kubectl exec -it mypod /bin/bash
root@mypod:/# cat /root/my_dir/my_password
sunyaowei
```

##### 以环境变量的形式使用Secret（常用）

> 如果secret更新，pod引用中，并不会自动更新

1、创建secret文件夹，里面存放yml文件

```
生成root 和  sunyaowei的加密数据

echo -n 'root' | base64
echo -n 'ChenFuguo@123' | base64
```

2、编写创建secret的yml文件

```
vim  mysql-sec.yaml

---
kind: Secret
apiVersion: v1
metadata:
  name: mysql-user-pass
type: Opaque
data:
  username: cm9vdA== # root
  password: Q2hlbkZ1Z3VvQDEyMw== #sunyaowei
```

3、执行生成secret

```
kubectl apply -f mysql-sec.yaml secret/mysql-user-pass created
kubectl get secret

NAME                  TYPE                                  DATA   AGE
db-user-pass          Opaque                                2      8h
default-token-stcpf   kubernetes.io/service-account-token   3      33h
mysecret              Opaque                                2      7h58m
mysql-user-pass       Opaque                                2      20s
```

4、继续在mysql-sec.yaml中追加剧本，生成创建容器的pod

```
vim  mysql-sec.yaml

---
kind: Secret
apiVersion: v1
metadata:
  name: mysql-user-pass
type: Opaque
data:
  username: cm9vdA== # root
  password: Q2hlbkZ1Z3VvQDEyMw== #sunyaowei

---
apiVersion: v1
kind: Pod
metadata:
  name: mysql
spec:
  containers:
  - name: mysql
    image: mysql:5.7
    env:
    - name: MYSQL_ROOT_PASSWORD #创建新的环境变量名称
      valueFrom:
        secretKeyRef: #调用的key是什么
          name: mysql-user-pass #变量的值来自于my-user-pass这个secret
          key: password #取mysql-user-pass的password的值 即 sunyaowei
```

5、继续执行mysql-sec.yaml文件

```
kubectl apply -f mysql-sec.yaml secret/mysql-user-pass unchanged pod/mysql created
```

6、查看pod状态，进入该pod，测试密码

```
kubectl get pod  -o wide

NAME    READY   STATUS    RESTARTS   AGE   IP           NODE        NOMINATED NODE   READINESS GATES
mysql   1/1     Running   0          68s   10.244.2.8   k8s-node2   <none>           <none>

kubectl get pod

NAME    READY   STATUS    RESTARTS   AGE
mysql   1/1     Running   0          63s


[root@k8s-master secret]# kubectl exec -it mysql /bin/bash
bash-4.2# mysql -uroot -p'sunyaowei'
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
登录成功！！
```

##### docker私仓secret应用

1、编写pod3.yml，从阿里云私有仓库下载地址

> 提前登录！！！

```
vim pod3.yml

---
apiVersion: v1
kind: Pod
metadata:
  namespace: kube-system
  name: mynginx
  labels:
    name: mynginx_name_pod
spec:
  nodeName: k8s-node1
  containers:
    - name: nginx
      image: registry.cn-hangzhou.aliyuncs.com/cfgnginx/nginx:1.24.0 #阿里云私有仓库的地址
      ports:
      - containerPort: 80
```

2、执行

```
kubectl apply -f pod3.yml pod/mynginx created
```

</details>

</details>

