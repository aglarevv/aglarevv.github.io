## NET转发模式

<details>
<summary>配置步骤</summary>

> 

1、lvs-server下载ipvsadm

```
yum install -y ipvsadm
```

2、启动路由转发功能

```
echo 1 > /proc/sys/net/ipv4/ip_forward
```

3、配置对外的ip

> -A 添加一个VIP
> -t TCP协议
> -s   schedule调度
> -rr  轮巡策略类型

```
ipvsadm -A -t 192.168.209.143:80  -s rr
```

4、添加真实服务器ip

> -a  添加一个真实lvs服务ip
> -r  真实服务器IP 地址
> -m    指定调度算法为“轮询”模式,即请求将被均匀地分发到配置的所有真实服务器上。
> 真实服务器设置为仅主机模式

```
ipvsadm -a -t 192.168.209.143:80 -r 192.168.200.4:80 -m
```

5、查看配置策略

```
ipvsadm -Ln
```

6、查看测试结果

> 打开浏览器输入lvs-server地址进行测试

```
ipvsadm -Lnc
```

**至此结束**

</details>

## DR直接路由模式

<details>
<summary>配置步骤</summary>

> 

### LVS服务器

#### 1LVS准备VIP和路由

1、lvs添加虚拟ip

```
ifconfig ens33:0 192.168.229.123 broadcast 192.168.229.255 netmask 255.255.255.0 up
```

> 在ens33上添加一个虚拟ip192.168.229.123

2、添加虚拟路由

```
route add  -host 192.168.229.123 dev ens33:0
```

3、设置路由转发

> vi /etc/sysctl.conf

```
net.ipv4.ip_forward = 1 #开启路由功能
net.ipv4.conf.all.send_redirects = 0 #禁止转发重定向报文
net.ipv4.conf.ens33.send_redirects = 0 #禁止ens33转发重定向报文
net.ipv4.conf.default.send_redirects = 0 #禁止转发默认重定向报文
```

#### 设置负载均衡规则

##### 设置IPVSADM

1、安装ipvsadm

```
yum install ipvsadm  -y
```

2、清理所有ipvs规则

```
ipvsadm     -C
```

3、配置ip

```
ipvsadm -A -t 192.168.229.123:80 -s rr
```

4、添加真实服务器ip

```
ipvsadm -a -t 192.168.209.143:80 -r 192.168.200.4:80 -g
```

> -A  添加virtual server
> -t  指定使用tcp协议
> -s  指定调度策略/负载算法为rr
> -a  添加realserver
> -r  指定realserver是谁
> -g  LVS类型DR

> LVS类型：
> -g：Gateway，DR(默认使用的类型)
> -i：ipip，TUN
> -m：masquerade(地址伪装)，NAT

**至此结束**

</details>
