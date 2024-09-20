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

<details>
<summary>中文乱码解决</summary>

>

1、复制字体文件
- win+r 输入fonts，复制 微软雅黑 字体文件并重命名为msyh.ttf

2、上传到服务器字体目录下
- /usr/share/zabbix/fonts/

3、修改文件权限
```
chmod 777  /usr/share/zabbix/assets/fonts/msyh.ttf
```
4、替换
```
sed -i "s/graphfont/msyh/g" /usr/share/zabbix/include/defines.inc.php
```
5、确认替换结果
```
grep FONT_NAME /usr/share/zabbix/include/defines.inc.php  -n
```
**至此结束**
</details>

<details>
<summary>微信告警</summary>

>

1、注册企业微信
2、创建自己的应用。例：
![image](https://github.com/user-attachments/assets/7c6bb3dc-cb62-42b4-aecb-f782108d1e99)
3、记住 AgentId 和 Secret 。例：
![image](https://github.com/user-attachments/assets/d2d65ff8-ff86-46cc-869f-de7efa4b30a9)
4、记住企业id。例：
![image](https://github.com/user-attachments/assets/2653c2e3-c972-49b1-a324-9932435454f0)
5、记住部门id。例：
![image](https://github.com/user-attachments/assets/165f96f8-6dea-4a3c-a9a1-e1433d4d0548)
6、在zabbix-server服务器上创建脚本。
> vim   /usr/lib/zabbix/alertscripts/wechat.py
修改如下内容：
- self.__corpid = '公司的corpid'
- ​self.__secret = '应用的secret' 
- 'toparty':部门id,
- ​'agentid':"应用id", 

```
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import urllib,urllib2,json
import sys
reload(sys)
sys.setdefaultencoding( "utf-8" )


class WeChat(object):
        __token_id = ''
        # init attribute
        def __init__(self,url):
                self.__url = url.rstrip('/')
                self.__corpid = '公司的corpid'
                self.__secret = '应用的secret'


        # Get TokenID
        def authID(self):
                params = {'corpid':self.__corpid, 'corpsecret':self.__secret}
                data = urllib.urlencode(params)


                content = self.getToken(data)


                try:
                        self.__token_id = content['access_token']
                        # print content['access_token']
                except KeyError:
                        raise KeyError


        # Establish a connection
        def getToken(self,data,url_prefix='/'):
                url = self.__url + url_prefix + 'gettoken?'
                try:
                        response = urllib2.Request(url + data)
                except KeyError:
                        raise KeyError
                result = urllib2.urlopen(response)
                content = json.loads(result.read())
                return content


        # Get sendmessage url
        def postData(self,data,url_prefix='/'):
                url = self.__url + url_prefix + 'message/send?access_token=%s' % self.__token_id
                request = urllib2.Request(url,data)
                try:
                        result = urllib2.urlopen(request)
                except urllib2.HTTPError as e:
                        if hasattr(e,'reason'):
                                print 'reason',e.reason
                        elif hasattr(e,'code'):
                                print 'code',e.code
                        return 0
                else:
                        content = json.loads(result.read())
                        result.close()
                return content

        # send message
        def sendMessage(self,touser,message):
                self.authID()
                data = json.dumps({
                        'touser':touser,
                        'toparty':部门id,
                        'msgtype':"text",
                        'agentid':"应用id",
                        'text':{
                                'content':message
                        },
                        'safe':"0"
                },ensure_ascii=False)


                response = self.postData(data)
                print response

if __name__ == '__main__':
        a = WeChat('https://qyapi.weixin.qq.com/cgi-bin')
        a.sendMessage(sys.argv[1],sys.argv[3])
```
7、修改权限
```
 chown zabbix.zabbix /usr/lib/zabbix/alertscripts/wechat.py
```
```
chmod 777 /usr/lib/zabbix/alertscripts/wechat.py
```
8、添加可信域名。例：
![image](https://github.com/user-attachments/assets/eac8ce18-83ac-4d2b-8af7-a2cb73991a62)
![image](https://github.com/user-attachments/assets/234fb640-9482-4ae8-94f6-573c4af39001)
![image](https://github.com/user-attachments/assets/9cff4bd4-8f16-46f3-a02a-409ff3d22518)
9、下载文件，上传到域名对应的服务器上。例：
![image](https://github.com/user-attachments/assets/315e2a8b-b394-4c96-8688-69fe86b96e1d)
10、添加可信ip。例：
![image](https://github.com/user-attachments/assets/dace0398-413a-4ee1-af32-c5d76e3b0b39)
11、测试脚本
> cd /usr/lib/zabbix/alertscripts
```
./wechat.py jack test test {u'invalidparty': u'2', u'invaliduser': u'wusong', u'errcode': 0, u'errmsg': u'ok'}
```
**至此结束**
</details>
