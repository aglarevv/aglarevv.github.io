## top命令：动态监控系统资源

```
top -d 1：每秒刷新
P：按cpu使用率排序
M：按内存使用率排序
```

## 校对时间

> 使用ntp工具进行校对

```
yum install ntp -y
ntpdate cn.pool.ntp.org
```

## 循环调度任务

> cronie工具包里的组件

```
yum install cronie -y
crontab -e 进入编辑界面
```

## tail命令：查看文件尾部

```
tail -f 动态查看
```

## 日志轮转

```
默认日志生成在/var/log/下
messages：linux系统本身运行时的日志
secure：认证，安全的日志
postfix：邮件相关的日志
cron：crond，at进行相关的日志
dmsg：系统启动相关的日志
yum.log：yum相关的日志

默认配置文件：/etc/logrotate.conf
配置文件存放路径：/etc/logrotate.d/
使用时在配置文件中引入自定义配置文件
```

## sed命令：字符流编辑器

> 操作、过滤、转换文本内容的工具，配合正则对文件实现快速增删查改

```
sed -n "p" file ：打印文件所有行
sed -i "s/**/**/g" file ：修改文件
```

## awk命令：文本格式化，转换为标准的excel表样式

## HP服务器硬盘位置

```
/dev/cciss/c0d0p1：c0是第一个控制器，d0是第一块磁盘，p1是分区1
```

## 磁盘相关

```
查看磁盘分区：lsblk
查看当前使用磁盘文件：df -TH
磁盘自动开机挂载：/etc/rc.d/rc.local文件里添加挂载命令。这个文件开机自动执行
```

## 更改ip地址

```
vi /etc/sysconfig/network-scripts/ifcfg-eth0
```

## 防火墙

```
添加允许通过的服务：firewall-cmd --zone=public --add-service=http
查看当前使用区域配置：firewall-cmd --list-all
删除允许通过的服务或端口：firewall-cmd --zone=public --remove-service=http or --remove-port=1234/tcp
添加允许通过的端口：firewall-cmd --zone=public --add-port=1234/tcp
```

> [!TIP]
> 以上全部只在本次开机生效，要永久性生效，添加 --permanent参数，之后重新启动防火墙或使用 --reload参数重新加载配置

## 关机

```
init 0
```

## 重启

```
init 6
```

## 查看当前用户

```
whoami
```

## 查看用户id

```
id -u
```

## 查看内核版本

```
uname -r
```

## 查看CPU信息

```
lscpu
```

## 查看内存信息

```
ree -h
```

## 查看硬盘信息

```
lsblk
```

## 查看当前登录用户，登录终端

```
who am i
```

## 查看当前所有登录用户

```
who
```

## 更改命令行颜色（临时）

```
PS1="\[\e[1;35m\][\u@\h \w]\\$\[\e[0m\]"
```

## 登录提示内容

```
vi /etc/motd
```

## 查看日历

```
cal -y
```

## 指定登录shell

```
chsh -s /bin/bash
```

## vim文件分割

```
多文件水平分割：vim -o f1 f2
多文件垂直分割：vim -O f1 f2
单文件水平分割：CTRL+w,s
单文件垂直分割：CTRL+w,v
退出相邻一个：CTRL+w,q
退出其他所有：CTRL+w,o
推出所有：:wqll
```

## vim配置文件

```
个人位置：~/.vimrc
全局位置：/etc/vimrc
```

## 静态ip配置

> vim /etc/sysconfig/netword-scripts/ifcfg-ens33

```
TYPE="Ethernet"
PROXY_METHOD="none"
BROWSER_ONLY="no"
BOOTPROTO="none"
DEFROUTE="yes"
IPV4_FAILURE_FATAL="no"
IPV6INIT="yes"
IPV6_AUTOCONF="yes"
IPV6_DEFROUTE="yes"
IPV6_FAILURE_FATAL="no"
IPV6_ADDR_GEN_MODE="stable-privacy"
NAME="ens33"
UUID="b4ce1d74-4e77-419e-9616-823cee6bbaf9"
DEVICE="ens33"
ONBOOT="yes"
IPADDR="192.168.209.138"
PREFIX="24"
GATEWAY="192.168.209.2"
DNS1="8.8.8.8"
IPV6_PRIVACY="no"
ZONE=
```


