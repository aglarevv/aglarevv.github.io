## 配置步骤

<details>
<summary>配置步骤</summary>

> 

1、安装

```
yum -y install epel-release
```

```
yum -y install haproxy
```

2、编辑配置文件

> vim /etc/haproxy/haproxy.cfg
> 配置文件中分五部分内容：
> 
> - global：  设置全局配置参数，属于进程的配置，通常是和操作系统相关。
> - defaults：配置默认参数，这些参数可以被用到frontend，backend，Listen组件；
> - frontend：接收请求的前端虚拟节点，Frontend可以更加规则直接指定具体使用后端的backend；
> - backend：后端服务集群的配置，是真实服务器，一个Backend对应一个或者多个实体服务器；
> - Listen ：frontend和backend的组合体。

```
global 							#全局配置信息
        	log 127.0.0.1 local3 info	#日志服务器
        	maxconn 4096			#最大连接数
                uid nobody				#用户身份
        #       uid 99
                gid nobody				#组身份
        #       gid 99
        	daemon					#守护进程方式后台运行
        	nbproc 1				#工作进程数量
        	pidfile /run/haproxy.pid	#haproxy进程ID存储位置

        defaults						#默认设置
        	log		   global
        	mode	   http			#工作模式 http ,tcp 是 4 层,http是 7 层
        	maxconn 2048			#最大连接数
        	retries 	3				#健康检查。3 次连接失败就认为服务器不可用
        	option	redispatch		
#如果 cookie 写入了 serverId 而客户端不会刷新 cookie,当serverId 对应的服务器挂掉后,强制定向到其他健康的服务器
        	contimeout	5000		#连接超时时间，单位毫秒ms
        	clitimeout	    50000		#客户端超时
        	srvtimeout	    50000		#服务器超时
        #timeout connect 5000
        #timeout client 50000
        #timeout server 50000
            option abortonclose		#当服务器负载很高的时候，自动结束掉当前队列处理比较久的链接
            stats uri /admin?status		#设置统计页面的uri为/admin?stats
            stats realm Private lands	#设置统计页面认证时的提示内容
            stats auth admin:password	
#统计页面认证的用户和密码，如果要设置多个，另起一行写入即可。客户端使用elinks浏览器时不生效
            stats hide-version			#隐藏统计页面上的haproxy版本信息
        
        frontend http-in				#前端配置块。面对用户侧
        	bind 0.0.0.0:80			#监听地址和端口
        	mode http
        	log global
        	option httplog			#日志类别 http 日志格式
        	option httpclose			
#打开支持主动关闭功能,每次请求完毕后主动关闭http通道，ha-proxy不支持keep-alive,只能模拟这种模式的实现
             acl html url_reg  -i  \.html$
#1、访问控制列表名称html。规则要求访问以html结尾的url时。use_backend  <服务器组>  if  <ACL名字>
             use_backend html-server if  html	#2、如果满足acl html规则，则推送给后端服务器 html-server
             default_backend html-server	#3、默认的后端服务器是 html-server
        
        backend html-server			#后端服务器名称为  html-server
        	mode http
        	balance roundrobin		#负载均衡的方式
        	option httpchk GET /index.html	#健康检查
        	cookie SERVERID insert indirect nocache	#客户端的 cookie 信息，允许插入serverid到cookie中，此处cookie号不同
        	server html-A web1:80 weight 1 cookie 3 check inter 2000 rise 2 fall 5	
#服务器ID，避免rr算法将客户机请求转发给其他服务器 ,对后端服务器的健康状况检查间隔为2000毫秒，连续2次健康检查成功，则认为是有效的，连续5次健康检查失败，则认为服务器宕机
        	server html-B web2:80 weight 1 cookie 4 check inter 2000 rise 2 fall 5
```


3、添加域名解析

> vim /etc/hosts

```
192.168.209.13 web1
192.168.209.14 web2
```

4、启动

```
systemctl start haproxy.service
```

查看日志

```
cat /var/log/messages
```

**至此完成**

</details>
