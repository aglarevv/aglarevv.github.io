## 部署

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

### k8s-master

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

### k8s-master & k8s-node

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

### 部署flannel网络插件

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

### 在Master节点部署组件

<details>
<summary>在Master节点部署组件</summary>

> 

#### 准备证书

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

#### master节点部署apiserver组件

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

#### master节点部署schduler组件

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

#### master节点部署controller-manager组件

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

```
vim dockerPullv1.19.1.sh

#!/bin/bash
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-contr
oller-manager:v1.19.1
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-prox
y:v1.19.1
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-apise
rver:v1.19.1
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/kube-sched
uler:v1.19.1
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:1.
7.0
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.4.1
3-0
docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.2
```

2、重新打tag

> 下载完了之后需要将阿里云下载下来的所有镜像打成k8s.gcr.io/kube-controller-manage
> r:v1.19.1这样的tag

```
vim tagv1.19.1.sh

#!/bin/bash
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-contro
ller-manager:v1.19.1 k8s.gcr.io/kube-controller-manager:v1.19.1
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-proxy:
v1.19.1 k8s.gcr.io/kube-proxy:v1.19.1
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-apiser
ver:v1.19.1 k8s.gcr.io/kube-apiserver:v1.19.1
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/kube-schedu
ler:v1.19.1 k8s.gcr.io/kube-scheduler:v1.19.1
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:1.
7.0 k8s.gcr.io/coredns:1.7.0
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.4.13
-0 k8s.gcr.io/etcd:3.4.13-0
docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.2 k
8s.gcr.io/pause:3.2
```

3、所有机器安装docker

```
yum remove docker \
docker-client \
docker-client-latest \
docker-common \
docker-latest \
docker-latest-logrotate \
docker-logrotate \
docker-selinux \
docker-engine-selinux \
docker-engine
```

```
yum install -y yum-utils device-mapper-persistent-data lvm2 git
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum install docker-ce -y

启动并设置开机启动
kuberadm比较严格，必须设置docker开启自启，swp分区必须关闭，否则无法正常初始化
```

</details>
