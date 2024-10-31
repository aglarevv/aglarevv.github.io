## 部署

<details>
<summary>单机部署</summary>

>

1、安装Erlarg

```
yum -y install erlang -y
```

2、安装RabbitMQ

```
yum install -y rabbitmq-server
```

3、修改配置文件

```
cp /usr/share/doc/rabbitmq-server-3.3.5/rabbitmq.config.example /etc/rabbitmq/rabbitmq.config
```

```
vim /etc/rabbitmq/rabbitmq.config

注释第53行
{loopback_users, []}
```

4、安装插件并启动服务

```
rabbitmq-plugins enable rabbitmq_management
```

5、重启RabbitMQ服务

```
systemctl restart rabbitmq-server
```

6、查看节点状态

```
rabbitmqctl cluster_status
```

7、访问测试

```
ip地址为rabbitMQ所在服务器的地址
端口号：15672
默认账号密码：guest/guest
```

</details>

<details>
<summary>集群部署</summary>

> 

1、所有节点配置host解析

```
vim  /etc/hosts
```

2、所有节点安装erLang和rabbitmq（参照单机部署的1、2、3步）
3、所有节点cookie内容一致

```
scp /var/lib/rabbitmq/.erlang.cookie  rabbitmq3:/var/lib/rabbitmq/.erlang.cookie

源码包部署一般会存在.erlang.cookie文件；
rpm包部署一般是在/var/lib/rabbitmq/.erlang.cookie。
将 rabbitmq1 的该文件使用rsync或者是scp复制到 rabbitmq2、rabbitmq3，文件权限需要是400。
```

4、除了rabbitmq1 都重启服务

```
systemctl restart rabbitmq-server
```

5、除了rabbitmq1 都关闭服务

```
rabbitmqctl stop
```

6、除了rabbitmq1 都分离运行

```
rabbitmq-server -detached
```

7、所有主机都添加用户并设置密码

```
rabbitmqctl add_user admin admin
rabbitmqctl set_permissions -p "/" admin ".*" ".*" ".*"
rabbitmqctl set_user_tags admin administrator
```

8、所有节点都加入 rabbitmq1 中组成集群

```
rabbitmqctl stop_app

仅停止应用，不关闭节点
```

```
rabbitmqctl join_cluster rabbit@rabbitmq1
```

```
rabbitmqctl start_app
```

9、使用内存节点加入集群（了解）

```
rabbitmqctl join_cluster --ram rabbit@rabbitmq1
```

10、查看集群状态

```
rabbitmqctl cluster_status
```

11、设置镜像队列策略，如图：
![image](https://github.com/user-attachments/assets/2ff7c346-41cc-4e3b-9e1b-967560ac0db2)
![image](https://github.com/user-attachments/assets/c42d334d-a8ea-46f0-97d1-e556b7d7db44)
![image](https://github.com/user-attachments/assets/680d609f-e2e9-43eb-b2fa-420b81953352)
![image](https://github.com/user-attachments/assets/80403149-d066-42ab-ba9a-421ffd57b84f)

```
然后在linux中设置镜像队列策略：语法介绍
   rabbitmqctl set_policy -p vhost1 ha-all "^" '{"ha-mode":"all"}'
 案例中的命令
  rabbitmqctl set_policy -p jinlongyu ha-all "^" '{"ha-mode":"all"}'
 注释
   "coresystem"
     		vhost名称，此处应该填写“jinlongyu”
   ha-all	策略名称
"^"	queue的匹配模式为匹配所有的队列
 { }：
    为镜像定义，包括三个部分ha-mode, ha-params, ha-sync-mode
    ha-mode	指明镜像队列的模式，有效值为 all/exactly/nodes
    	all			   表示在集群中所有的节点上进行镜像，包含新增节点
    	exactly		（可选）表示在指定个数的节点上进行镜像，节点的个数由ha-params指定
   	nodes		（可选）表示在指定的节点上进行镜像，节点名称通过ha-params指定
    ha-sync-mode	（可选）进行队列中消息的同步方式，有效值为automatic和manual

  提示：此时镜像队列设置成功。队列会被复制到各个节点，各个节点状态保持一致（这里的虚拟主机vhost1 。是代码中需要用到的虚拟主机，虚拟主机的作用是做一个消息队列进行隔离，本质上可认为是一个rabbitmq-server，是否增加虚拟主机，增加几个，这是由开发中的业务决定，即有哪几类服务，哪些服务用哪一个虚拟主机，这是一个规划）。
```

8、访问测试

```
http://ip:15672
账号：admin
密码：admin
```



</details>
