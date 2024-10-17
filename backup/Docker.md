## Docker部署

<details>
<summary>1、可访问官网方式</summary>

> 

1、下载yum源

```
wget https://download.docker.com/linux/centos/docker-ce.repo
```

2、移动位置并重命名

```
mv docker-ce.repo /etc/yum.repos.d
```

3、安装docker

```
yum install -y docker-ce
```

4、启动docker

```
systemctl enable docker && systemctl start docker
```

</details>

<details>
<summary>2、使用国内镜像源方式</summary>

> 

[配置阿里镜像源](https://developer.aliyun.com/mirror/docker-ce)。或可直接参考如下步骤

1、安装必要的系统工具

```
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```

2、添加软件源信息

```
sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

```
sudo sed -i 's+download.docker.com+mirrors.aliyun.com/docker-ce+' /etc/yum.repos.d/docker-ce.repo
```

3、更新并安装docker-ce

```
sudo yum makecache fast && yum -y install docker-ce
```

4、开启docker服务

```
sudo service docker start
```

5、启动docker

```
systemctl enable docker && systemctl start docker
```

</details>


<details>
<summary>清理docker环境</summary>

> 

```
yum remove docker \
docker-client \
docker-client-latest \
docker-common \
docker-latest \
docker-latest-logrotate \
docker-logrotate \
docker-selinux \
docker-engine-selinux \
docker-engine
```

</details>

## Docker使用

### 镜像

<details>
<summary>镜像</summary>

> 

### 查看镜像

查看docker版本

```
docker -v
```

查看docker运行状态

```
docker info
```

查看镜像列表

```
docker images
```

查看镜像详细信息

```
docker inspect 镜像名称
```

查看镜像制作过程

```
docker history 镜像名或id
```

### 拉取镜像

拉取镜像

```
docker pull 镜像名:标签
```

### 删除镜像

删除镜像

```
docker rmi 镜像名或id
```

删除所有镜像

```
docker rmi $(docker images -q)
```

</details>

### 容器

<details>
<summary>容器</summary>

> 

### 启动容器

启动容器

```
docker run -it 镜像名或id /bin/bash
docker start 镜像名或id
```

| 命令 | 区别 |
| --- | --- |
| docker run | 首先在指定的镜像上创建一个可写的容器层，然后使用指定的命令启动它。这意味着 `docker run` 相当于执行了 `docker create` 和 `docker start` 两个步骤 |
| docker start | 用于启动已经存在的容器。它不会创建新的容器，而是重新启动已停止的容器 |

创建新容器但不启动

```
docker create -it 镜像名 /bin/bash
```

创建新容器并随容器而启动

```
docker run -it --restart=always 镜像名或id /bin/bash
```

进入后台运行的容器

```
docker exec -it 容器名或id /bin/bash
```

### 查看容器

修改容器名称

```
docker rename 旧名称 新名称
```

动态显示容器资源使用情况

```
docker stats
```

显示运行的容器里进程信息

```
docker top 容器名或id
```

捕获容器停止时的退出码

```
docker wait 容器名或id
```

查看所有容器

```
docker ps -a
```

查看运行中容器

```
docker ps
```

查看所有容器

```
docker container ls -a
```

查看所有容器id

```
docker container ls -q
```

### 拷贝容器

容器文件拷贝

```
docker cp 源文件路径 容器名或id:绝对路径
```

### 删除容器

暂停容器内所有进程

```
docker pause 容器名
```

删除容器

```
docker rm 容器名或id
容器必须是停止状态
```

删除所有容器

```
docker stop $(docker container ls -q)  && docker rm $(docker container ls -qa)
```

一次性容器（容器结束自动删除）

```
docker run -it --rm 容器名或id /bin/bash
```

### 打包容器

把运行中的容器打成tar包镜像文件

```
docker export -o xxx.tar 要打包的容器名或id
或
docker export 容器名称 > 镜像.tar
```

导入镜像文件

```
docker import 要导入的压缩包  自定义镜像名:版本号
```

创建本地镜像

```
docker commit [option] 容器id 镜像名或id
-m 添加注释
-a 作者
-p，–pause=true 提交时暂停容器运⾏
```

打包镜像

```
docker save -o xxx.tar 镜像名或id
```

解压镜像

```
docker load < xxxtar
```

| 命令 | 区别 | 适用场景 |
| --- | --- | --- |
| docker export | 将一个 Docker 容器的文件系统打包成一个 tar 文件。这个 tar 文件不包含镜像的历史记录和元数据，只包含容器当前的状态。 | 需要快速创建容器的备份或快照，且不需要保留镜像的历史和元数据的情况。 |
| docker save | 将一个或多个 Docker 镜像打包成一个 tar 文件。这个 tar 文件包含了镜像的所有层、元数据和历史信息。 | 需要保存完整的镜像历史和元数据的情况，例如离线部署或备份镜像。 |

</details>

### DockerFile

<details>
<summary>使用DockerFile创建镜像</summary>

> 

<details>
<summary>DockerFile的主要指令：</summary>

> 

1. **`FROM`**：指定基础镜像。每个 Dockerfile 都以 `FROM` 开头，定义了镜像的起始点。例如：
   
   ```
   FROM ubuntu:20.04
   ```
2. **`RUN`**：在镜像中执行命令。通常用于安装软件包或进行系统配置。例如：
   
   ```
   RUN apt-get update && apt-get install -y nginx
   ```
3. **`COPY`**：将本地文件或目录复制到镜像中。例如：
   
   ```
   COPY ./localfile /path/in/container/
   ```
4. **`ADD`**：类似于 `COPY`，但支持从 URL 下载文件和解压归档文件。例如：
   
   ```
   ADD https://example.com/file.tar.gz /path/in/container/
   ```
5. **`CMD`**：指定容器启动时的默认命令。如果 Dockerfile 中定义了多个 `CMD`，只有最后一个 `CMD` 会生效。例如：
   
   ```
   CMD ["nginx", "-g", "daemon off;"]
   ```
6. **`ENTRYPOINT`**：定义容器启动时的入口点，可以与 `CMD` 结合使用来设置默认参数。例如：
   
   ```
   ENTRYPOINT ["python"]
   CMD ["app.py"]
   ```
7. **`EXPOSE`**：声明容器运行时会监听的端口，但不会自动打开端口。例如：
   
   ```
   EXPOSE 80
   ```
8. **`VOLUME`**：创建挂载点，并可以在运行时挂载主机目录。例如：
   
   ```
   VOLUME ["/data"]
   ```
9. **`WORKDIR`**：设置工作目录。之后的 `RUN`、`CMD`、`ENTRYPOINT` 指令都会在这个目录下执行。例如：
   
   ```
   WORKDIR /app
   ```
10. **`ENV`**：设置环境变量。例如：
    
    ```
    ENV APP_ENV=production
    ```

</details>

根据指定的DockerFile构建docker镜像

```
docker build [OPTIONS] < 路径 | URL | -> 1
```

```powershell
【常用option说明】
--build-arg，设置构建时的变量
--no-cache，默认false。设置该选项，将不使⽤Build Cache构建镜像
--pull，默认false。设置该选项，总是尝试pull镜像的最新版本
--compress，默认false。设置该选项，将使⽤gzip压缩构建的上下⽂
--disable-content-trust，默认true。设置该选项，将对镜像进⾏验证
--file, -f，Dockerfile的完整路径，默认值为‘PATH/Dockerfile’
--isolation，默认--isolation="default"，即Linux命名空间；其他还有process或hyperv
--label，为⽣成的镜像设置metadata
--squash，默认false。设置该选项，将新构建出的多个层压缩为⼀个新层，但是将⽆法在多个镜
像之间共享新层；设置该选项，实际上是创建了新image，同时保留原有image。

--tag, -t，镜像的名字及tag，通常name:tag或者name格式；可以在⼀次构建中为⼀个镜像设置多个tag

--network，默认default。设置该选项，Set the networking mode for the RUN instr
uctions during build
--quiet, -q ，默认false。设置该选项，Suppress the build output and print image ID on success
--force-rm，默认false。设置该选项，总是删除掉中间环节的容器
--rm，默认--rm=true，即整个构建过程成功后删除中间环节的容器
```

**示例**

```powershell
[root@docker-server tomcat]# vim Dockerfile
# This my first jenkins Dockerfile
# Version 1.0
FROM centos:7
MAINTAINER laochen@123.com
ENV JAVA_HOME /usr/local/jdk-11.0.16
ENV TOMCAT_HOME /usr/local/apache-tomcat-9.0.79
ENV PATH=$JAVA_HOME/bin:$PATH
ADD apache-tomcat-9.0.79.tar.gz /usr/local/
ADD jdk-11.0.16_linux-x64_bin.tar.gz /usr/local/
RUN rm -rf /usr/local/apache-tomcat-9.0.79/webapps/*
ADD jenkins.war /usr/local/apache-tomcat-9.0.79/webapps
RUN rm -rf apache-tomcat-9.0.79.tar.gz jdk-11.0.16_linux-x64_bin.tar.gz
EXPOSE 8080
ENTRYPOINT ["/usr/local/apache-tomcat-9.0.79/bin/catalina.sh","run"] #运
⾏命令
```

</details>

## 可能遇到的报错

<details>
<summary>可能遇到的报错</summary>

> 

- 1、docker info的时候报错：bridge-nf-call-iptables is disabled
  解决：

```
追加如下配置,然后重启系统
# vim /etc/sysctl.conf 
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-arptables = 1
```

- 2、虚拟机ping百度也能ping通，但是需要等好⼏秒才出结果，关键是下载镜像⼀直报错
  docker pull daocloud.io/library/nginx
  Using default tag: latest
  Error response from daemon: Get https://daocloud.io/v2/: dial tcp: looku
  p daocloud.io on 192.168.1.2:53: read udp 192.168.1.189:41335->192.168.
  1.2:53: i/o timeout
  解决：
  ```
  更改DNS
  vim /etc/resolv.conf
  nameserver 8.8.8.8
  ```

</details>

