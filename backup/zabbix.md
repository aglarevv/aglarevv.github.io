# zabbix

<details>
<summary>安装步骤</summary>

>

**zabbix服务器上：**

1、下载
 ```
rpm -Uvh https://repo.zabbix.com/zabbix/5.0/rhel/7/x86_64/zabbix-release-5.0-1.el7.noarch.rpm
```
```
yum clean all
```
```
yum install zabbix-server-mysql zabbix-agent
```
2、更换SCL源
```
yum install centos-release-scl 
```
```
cd /etc/yum.repos.d/
mv CentOS-SCLo-scl.repo CentOS-SCLo-scl.repo.bak
mv CentOS-SCLo-scl-rh.repo CentOS-SCLo-scl-rh.repo.bak
```
3、编辑SCL
> vim CentOS-SCLo-scl-rh.repo

```
[centos-sclo-rh]
name=CentOS-7 - SCLo rh
baseurl=https://mirrors.aliyun.com/centos/7/sclo/x86_64/rh/
gpgcheck=1
enabled=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-SIG-SCLo
```
4、安装前台页面
```
yum  install  zabbix-web-mysql-scl zabbix-apache-conf-scl   
```
```
yum -y install mariadb mariadb-server
```
5、启动数据库
```
systemctl enable mariadb
```
```
systemctl start mariadb
```
6、授权数据库
```
mysql
```
```
create database zabbix character set utf8 collate utf8_bin;
```
```
 create user zabbix@localhost identified by 'AGLAREvv.1';
```
```
grant all privileges on zabbix.* to zabbix@localhost;
```
```
flush privileges;
```
```
exit
```
7、初始化zabbix
```
 zcat /usr/share/doc/zabbix-server-mysql-5.0.43/create.sql.gz | mysql -u zabbix -p zabbix 
```
8、配置账号密码
> vim /etc/zabbix/zabbix_server.conf

```
DBHost=localhost
DBName=zabbix
DBUser=zabbix
DBPassword=AGLAREvv.1
```
9、启动zabbix
```
systemctl enable zabbix-server.service 
```
```
systemctl start zabbix-server.service 
```
10、配置zabbix前端php
> vim  /etc/opt/rh/rh-php72/php-fpm.d/zabbix.conf
只需更改时区为 Asia/Shanghai

11、启动服务
```
systemctl restart zabbix-server zabbix-agent httpd rh-php72-php-fpm
```
```
systemctl enable zabbix-server zabbix-agent httpd rh-php72-php-fpm 
```
12、进入前台页面（本机ip:80/zabbix）按照指示操作
> ![image](https://github.com/user-attachments/assets/94e6ea10-98a9-461a-b56c-8d9721419815)

> ![image](https://github.com/user-attachments/assets/a54b8b61-3b9f-4971-b2d6-9e141c5cbccc)

> ![image](https://github.com/user-attachments/assets/7daa1f89-ba26-45fa-a515-245bd7f3a451)

> ![image](https://github.com/user-attachments/assets/dbec2026-015b-4530-99c0-35f1da04f2e0)

> ![image](https://github.com/user-attachments/assets/a6c99e84-3246-4156-bec6-533143819b3e)

**被监控主机上：**
1、设置主机名
```
hostname  web1
```
2、关闭防火墙，selinux
3、准备镜像源
> vim /etc/yum.repos.d/zabbix.repo 

```
[zabbix]
name=alibaba zabbix
baseurl=https://mirrors.aliyun.com/zabbix/zabbix/5.0/rhel/7/x86_64/
gpgcheck=0
enabled=1

[zabbix2]
name=alibaba zabbix frontend
baseurl=https://mirrors.aliyun.com/zabbix/zabbix/5.0/rhel/7/x86_64/frontend/
gpgcheck=0
enabled=1
```
4、安装
```
yum -y install zabbix-agent
```
5、修改服务器地址
> vim /etc/zabbix/zabbix_agentd.conf
修改Server、ServerActive、Hostname值

```
Server=192.168.209.143,192.168.100.11             被动模式 zabbix-server-ip    
ServerActive=192.168.209.143,192.168.100.11    主动模式  zabbix-server-ip    
Hostname=web1 
```
6、启动zabbix-agent
```
systemctl start zabbix-agent
```
```
systemctl enable zabbix-agent
```
**至此结束**
</details>
