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
5、等待片刻，解锁jenkins
![image](https://github.com/user-attachments/assets/2d793a12-ed80-4eda-87c1-8bb6ee501617)
6、下载插件，等待安装完成
![image](https://github.com/user-attachments/assets/82fb5514-91b7-493b-b9ab-6ce5663c7eb9)
7、创建用户
8、系统配置Manage Jenkins
- [ ] system中找到【全局属性】勾选 Environment variables，新增环境变量 JAVA_HOME 和 MAVEN_HOME 后保存。例：
![image](https://github.com/user-attachments/assets/cbe13d85-29d0-41f0-9130-df85530e089f)
- [ ] tools中找到【maven配置】填写文件路径 /usr/local/maven/conf/settings.xml。例：
![image](https://github.com/user-attachments/assets/4be23f56-3068-4eff-8049-7cfae2f62925)
- [ ] 找到【JDK安装】填写内容。例：
![image](https://github.com/user-attachments/assets/393c1554-0530-4b60-becb-b37072f4dac8)
- [ ] 找到【GIt安装】填写内容。例：
![image](https://github.com/user-attachments/assets/e501903f-096d-4d5e-8516-a9b7ab5c1ea6)
- [ ] 找到【Maven 安装】填写内容。例：
![image](https://github.com/user-attachments/assets/8fc40f14-cc45-47db-9ead-c603972b630b)
9、点击保存

10、安装如下插件
```
Maven Integration
Deploy to container
GitHub Authentication
GitHub Branch Source  # 默认已安装
Publish Over SSH
```
11、配置ssh

- 生成密钥
```
ssh-keygen 
```
- 将密钥发送到tomcat服务器
 > 填写服务器ip地址

```
 ssh-copy-id -i 192.168.209.11
```
- 查看私钥后复制
```
cat ~/.ssh/id_rsa
```
- 进入系统配置Manage Jenkins点击【system】，在其中找到【Publish over SSH】，粘贴复制的私钥。例：
![image](https://github.com/user-attachments/assets/24811584-5235-48d7-a324-c493d3a16059)
- 新增ssh server，测试成功后点击保存。例：
![image](https://github.com/user-attachments/assets/66176370-48f0-4e77-9e2e-1cce5e031dd6)

**至此安装完成**

## Jenkins+Maven+Github+Tomcat 自动化构建打包、部署
1、创建一个maven工程。例：
![image](https://github.com/user-attachments/assets/96d1f4dc-431f-42c2-b9d0-677b0664e551)
2、构建maven项目。例：
![image](https://github.com/user-attachments/assets/f3f43dfa-ad58-4555-b98d-60c9b08529f4)
![image](https://github.com/user-attachments/assets/cd29091e-0f92-4bd5-91fb-7ad204087701)
3、源码管理，可使用【https://github.com/bingyue/easy-springmvc-maven.git】。例：
![image](https://github.com/user-attachments/assets/68ae1a3a-39c8-4e78-a19e-7acd9c01b890)
4、构建触发器，默认选择即可。例：
![image](https://github.com/user-attachments/assets/2792301e-49ca-4aea-9da0-dcebfb8a53d3)
5、设置build，全局选项可填写【clean package -Dmaven.test.skip=true】。例：
![image](https://github.com/user-attachments/assets/90d1d1a3-4fc0-4c2a-839d-380a49619ab6)
6、构建后操作选择ssh，填写完内容后点击保存。例：
![image](https://github.com/user-attachments/assets/f85186a8-97e2-4ec0-abed-175c03f10314)
![image](https://github.com/user-attachments/assets/2292abbc-891a-43fb-b0d7-bd23bd93b848)
7、点击左侧 build now，开始构建。例：
![image](https://github.com/user-attachments/assets/87618709-46c4-46e1-ad9e-8be2a4075057)
**至此完成**