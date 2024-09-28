## redis安装步骤


<details>
<summary>安装步骤</summary>

> 

1、下载依赖

```
yum install -y gcc
```

2、下载redis-5.0.10，下载链接：[https://pan.quark.cn/s/5375bb15ccba](https://pan.quark.cn/s/5375bb15ccba)
3、解压缩

```
tar -zxvf redis-5.0.10.tar.gz
```

4、进入redis根目录

```
cd redis-5.0.10
```

5、复制配置文件

```
mkdir -p /etc/redis/
cp redis.conf /etc/redis/
```

6、编译安装

```
make && make install
```

7、启动redis

> 默认监听6379端口，前台启动
> 后台启动：修改配置文件里 daemonize=no 改为 daemonize=yes

```
redis-server /etc/redis/redis.conf
```

**至此完成

</details>

## redis主从复制

<details>
<summary>主从复制</summary>

> 

1、修改配置

- 主机：

1. 更改配置文件，绑定ip

```
bind 0.0.0.0
```

- 从机：

1. 更改配置文件

> 在 port 6379 后添加 slaveof 主机ip  redis端口号。例：

```
slaveof 192.168.209.143 6379
```

2、关闭防火墙并启动

- 主机、从机

```
systemctl stop firewalld
redis-server /etc/redis/redis.conf
```

3、在主机查看主从信息

```
redis-cli
```

```
info replication
```

</details>

## redis哨兵模式

<details>
<summary>添加哨兵</summary>

> 

1、编辑配置文件

- 主机

1. 更改绑定本机机器ip。例：

```
bind 192.168.209.143
```

- 从机

1. 更改绑定ip

```
bind 0.0.0.0
```

2. 添加从机。例：

```
slaveof 192.168.209.143 6379
```

- 哨兵

1. 进入redis根目录

```
cd redis-5.0.10
```

2. 配置文件 sentinel.conf

```
vim sentinel.conf
```

> 更改bind 当前机器ip
> 将 sentinel monitor mymaster 127.0.0.1 6379 2
> 修改为 sentinel monitor mymaster 192.168.209.143 6379 2

```
bind 192.168.209.12
sentinel monitor mymaster 192.168.209.143 6379 2
```

2、启动

```
redis-server /etc/redis/redis.conf
```

3、连接哨兵，查看主从信息。例：

> redis-cli -h 哨兵ip -p 26379

```
info
```

</details>


