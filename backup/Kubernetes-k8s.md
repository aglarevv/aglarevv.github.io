## 部署

<details>
<summary>二进制部署Kubernetes</summary>

> 

0、准备环境

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

## k8s-master & k8s-node

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
