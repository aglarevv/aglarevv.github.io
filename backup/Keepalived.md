## 配置步骤

<details>
<summary>配置步骤</summary>

> 

1、关闭防火墙，selinux
2、配置yum源
3、安装keepalived

```
yum -y install keepalived
```

4、编辑keepalived配置文件

> vi /etc/keepalived/keepalived.conf

#### master服务器

```
! Configuration File for keepalived
global_defs {
 router_id 1                            #设备在组中的标识，设置不一样即可
 }

#vrrp_script chk_nginx {                        #健康检查
# script "/etc/keepalived/ck_ng.sh"     #检查脚本
# interval 2                            #检查频率.秒
# weight -5                             #priority减5
# fall 3                                        #失败三次
# }

#高可用集群的组员设置
vrrp_instance VI_1 {               #VI_1。实例名两台路由器相同。同学们要注意区分。
    state MASTER                        #主或者从状态
    interface ens33                     #监控网卡
    mcast_src_ip 192.168.209.143         #心跳源IP，当前主机的ip
    virtual_router_id 55                #虚拟路由编号，主备要一致。同学们注意区分
    priority 100                        #优先级 数值越大优先级越高
    advert_int 1                        #心跳间隔 单位是秒

    authentication {                    #秘钥认证(1-8位)
        auth_type PASS
        auth_pass 123456
    }

    virtual_ipaddress {                 #VIP 虚拟ip
    192.168.209.100/24
        }

#  track_script {                       #引用脚本
#       chk_nginx
#    }

}
```

#### backup服务器

```
state MASTER改为  state BACKUP
mcast_src_ip 192.168.209.143改为backup服务器实际的IP mcast_src_ip 192.168.200.100
priority 100改为priority 99
```

**如下所示：**

```
! Configuration File for keepalived
global_defs {
 router_id 2
 }

#vrrp_script chk_nginx {
# script "/etc/keepalived/ck_ng.sh"
# interval 2
# weight -5
# fall 3
# }

vrrp_instance VI_1 {
    state BACKUP
    interface ens33
    mcast_src_ip 192.168.200.100
    virtual_router_id 55
    priority 99
    advert_int 1

    authentication {
        auth_type PASS
        auth_pass 123456
    }

    virtual_ipaddress {
    192.168.209.100/24
        }

#  track_script {
#       chk_nginx
#    }

}
```

5、设置开机启动

```
systemctl enable keepalived.service
```

**至此完成**

</details>

## 添加监控nginx脚本

<details>
<summary>添加监控nginx脚本</summary>

> 

1、编写脚本

> vi /etc/keepalived/ck_ng.sh

#### master服务器
```
#!/bin/bash
#检查nginx进程是否存在
counter=$(ps -C nginx --no-heading|wc -l)
if [ "${counter}" = "0" ]; then
#尝试启动一次nginx，停止5秒后再次检测
    systemctl start nginx
    sleep 5
    counter=$(ps -C nginx --no-heading|wc -l)
    if [ "${counter}" = "0" ]; then
#如果启动没成功，就杀掉keepalive触发主备切换
        systemctl stop keepalived 
    fi
fi
```

#### backup服务器

```
#!/bin/bash
#检查nginx进程是否存在
counter=$(ps -C nginx --no-heading|wc -l)
if [ "${counter}" = "0" ]; then
#尝试启动一次nginx，停止5秒后再次检测
    systemctl start nginx
    sleep 5
    counter=$(ps -C nginx --no-heading|wc -l)
    if [ "${counter}" = "0" ]; then
#如果启动没成功，就杀掉keepalive触发主备切换
        service keepalived stop
    fi
fi
```

2、赋予权限

```
chmod +x /etc/keepalived/ck_ng.sh
```

3、启动脚本

> vim /etc/keepalived/keepalived.conf
> 清除配置文件中的注释

4、重启keepalived

```
systemctl restart keepalived.service
```

**至此完成**

</details>

## keepalived+lvs集群配置

<details>
<summary>keepalived+lvs集群配置</summary>

> 

1、安装keepalived和lvs

```
yum install keepalived ipvsadm -y
```

> ipvsadm不启动

2、修改配置文件

> vim /etc/keepalived/keepalived.conf

#### master服务器

```
! Configuration File for keepalived
global_defs {						
	router_id Director1    #两边不一样。
	}
	
vrrp_instance VI_1 {				
	state MASTER				#另外一台机器是BACKUP	
	interface ens33				#心跳网卡	
	virtual_router_id 51			#虚拟路由编号，主备要一致
	priority 150				#优先级	
	advert_int 1				#检查间隔，单位秒	
	authentication {
		auth_type PASS
		auth_pass 1111
		}
	virtual_ipaddress {
		192.168.209.100/24       dev      ens33   	#VIP和工作接口
		}
	}
	
virtual_server 192.168.209.100 80 {		#LVS 配置，VIP,就是keepalived配置的对外地址
	delay_loop 3				#服务论询的时间间隔，#每隔3秒检查一次real_server状态
	lb_algo rr				#LVS 调度算法
	lb_kind DR	 			#LVS 集群模式
	protocol TCP
	real_server 192.168.200.13 80 {
		weight 1                    #权重
		TCP_CHECK {
			connect_timeout 3       #健康检查方式,连接超时时间
			}
		}
	real_server 192.168.200.14 80 {
		weight 1
		TCP_CHECK {
			connect_timeout 3    #设定连接超时时间为3秒 超过视为掉线
			}
		}
}
```

#### backup服务器

> 修改的内容：router_id Director2
> state BACKUP
> priority 100

```
! Configuration File for keepalived
global_defs {
        router_id Director2
        }

vrrp_instance VI_1 {
        state BACKUP                            #另外一台机器是BACKUP
        interface ens33                         #心跳网卡
        virtual_router_id 51
        priority 100                            #优先级
        advert_int 1                            #检查间隔，单位秒
        authentication {
                auth_type PASS
                auth_pass 1111
                }
        virtual_ipaddress {
                192.168.229.100/24 dev ens33       #VIP和工作端口
                }
        }

virtual_server 192.168.229.100 80 {                #LVS 配置，VIP
        delay_loop 3                            #服务论询的时间间隔
        lb_algo rr                              #LVS 调度算法
        lb_kind DR                              #LVS 集群模式
        protocol TCP
        real_server 192.168.229.13 80 {
                weight 1
                TCP_CHECK {
                        connect_timeout 3
                        }
                }
        real_server 192.168.229.14 80 {
                weight 1
                TCP_CHECK {
                        connect_timeout 3
                        }
                }
}
```

3、启动

```
systemctl enable keepalived
```

```
systemctl start keepalived
```

```
ipvsadm -Ln
```

```
reboot
```

**至此完成**

</details>
