# Jenkins安装步骤：

## 依赖工具下载：

<details>
<summary>Maven安装</summary>

>

1、下载链接（夸克网盘）：[https://pan.quark.cn/s/6f3b64b84a2c](url)
2、解压安装
3、配置环境变量
> vim /etc/profile.d/jenkins_tools.sh

```
export M2_HOME=/usr/local/maven 
export M2=$M2_HOME/bin 
PATH=$M2:$PATH:$HOME/bin:/usr/local/git/bin 
export MAVEN_HOME=/usr/local/maven 
export PATH=${MAVEN_HOME}/bin:$PATH 
```
4、刷新环境变量
```
source /etc/profile.d/jenkins_tools.sh
```
</details>

<details>
<summary>Git安装</summary>

>

下载链接：[https://pan.quark.cn/s/d0b1d505ce0b](url) ，使用此方式下载可跳过第2步
1、安装依赖
```
yum install curl-devel expat-devel gettext-devel openssl-devel zlib-devel gcc perl-ExtUtils-MakeMaker     fontconfig  -y
```
2、安装git
```
wget https://mirrors.edge.kernel.org/pub/software/scm/git/git-2.9.5.tar.gz
```
3、解压并进入到解压目录
```
tar -zxvf git-2.9.5.tar.gz  && cd git-2.9.5/
```
4、编译并安装在/usr/local/git 目录下
```
make prefix=/usr/local/git all && make prefix=/usr/local/git install
```
5、添加环境变量
> vim /etc/bashrc 

```
PATH=$PATH:$HOME/bin:/usr/local/git/bin
```
6、刷新环境变量
```
source /etc/bashrc
```
</details>

<details>
<summary>安装JDK11和tomcat9</summary>

>

1、安装JDK11，下载链接：[https://pan.quark.cn/s/6fcb6d97feee](url)
2、安装tomcat9，下载链接：[https://pan.quark.cn/s/88840aab4104](url)
3、解压JDK和tomcat
```
 tar -zxvf jdk-11.0.16_linux-x64_bin.tar.gz && tar -zxvf apache-tomcat-9.0.79.tar.gz 
```
4、移动并重命名
```
mv jdk-11.0.16 /usr/local/java && mv apache-tomcat-9.0.79 /usr/local/tomcat
```
5、添加环境变量
> vim /etc/profile.d/java.sh

```
TOMCAT_HOME=/usr/local/tomcat
JAVA_HOME=/usr/local/java
PATH=$TOMCAT_HOME/bin:$JAVA_HOME/bin:$PATH
export TOMCAT_HOME JAVA_HOME PATH
```
6、刷新环境变量
```
source /etc/profile.d/java.sh
```
</details>

## 正式开始安装jenkins
1、下载jenkins，下载链接：[https://pan.quark.cn/s/253559a17241](url)
2、删除tomcat下webapp所有文件
```
rm -rf /usr/local/tomcat/webapps/*
```
3、复制jenkins.war到webapp下
```
cp jenkins.war /usr/local/tomcat/webapps/
```
4、启动tomcat并访问（本机ip:8080/jenkins）
```
 /usr/local/tomcat/bin/startup.sh
```
