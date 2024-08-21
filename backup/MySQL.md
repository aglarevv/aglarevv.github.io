### 什么是数据库？
数据库是专门用于存放计算机数据的软件仓库，这个仓库安装一定的数据结构对数据进行组织和存储
### 数据库的分类
**1、关系型数据库**
遵循ACID理论
常见的有：Oracle、MySQL、MariaDB、Microsoft SQL Server
**2、非关系型数据库**
也称为NoSQL数据库，是作为关系型数据库的一个有效补充
常见的有：Memcached、Redis、MongoDB
**关系型数据库与非关系型数据库的优缺点:**
关系型数据库：
优点：易于维护、使用方便、支持复杂sql操作
缺点：读写性能较差，灵活性欠缺，存在硬盘I/O瓶颈
非关系型数据库：
优点：存储格式灵活，速度快，成本低
缺点：不支持sql语句，复杂查询欠缺

> SQL（Structured Query Language）结构化查询语言

### MySQL安装步骤：

1. 清理环境
```
yum erase mariadb mariadb-server mariadb-libs mariadb-devel -y
```
2.创建用户
```
useradd -r sql -M -s /sbin/nologin
```
3.下载源码
```
wget https://downloads.mysql.com/archives/get/p/23/file/mysql-5.7.26.tar.gz
```

> 二进制安装使用下面的命令（可选），如使用二进制安装，跳过第4，7步

```
wget https://downloads.mysql.com/archives/get/p/23/file/mysql-5.7.26-linux-glibc2.12-x86_64.tar.gz
```
4.安装编译工具
```
yum -y install ncurses ncurses-devel openssl-devel bison gcc gcc-c++ make cmake
```
5.创建MySQL目录
```
mkdir -p /opt/vv/{data,mysql,log}
```
6.解压
```
tar xzvf mysql-5.7.26.tar.gz -C /opt/vv/
```

> 二进制方式安装使用下面的命令解压并移动

```
tar xzvf mysql-5.7.26-linux-glibc2.12-x86_64.tar.gz 
mv mysql-5.7.26-linux-glibc2.12-x86_64/* /opt/vv/mysql
```
7.编译安装
```
cd /opt/vv/mysql-5.7.26/
```
```
cmake . \
-DDOWNLOAD_BOOST=1 \
-DWITH_BOOST=boost/boost_1_59_0/ \
-DCMAKE_INSTALL_PREFIX=/opt/vv/mysql \
-DSYSCONFDIR=/etc \
-DMYSQL_DATADIR=/opt/vv/data \
-DINSTALL_MANDIR=/usr/share/man \
-DMYSQL_TCP_PORT=3306 \
-DMYSQL_UNIX_ADDR=/tmp/mysql.sock \
-DDEFAULT_CHARSET=utf8 \
-DEXTRA_CHARSETS=all \
-DDEFAULT_COLLATION=utf8_general_ci \
-DWITH_READLINE=1 \
-DWITH_SSL=system \
-DWITH_EMBEDDED_SERVER=1 \
-DENABLED_LOCAL_INFILE=1 \
-DWITH_INNOBASE_STORAGE_ENGINE=1
```
> 参数解释：
-DCMAKE_INSTALL_PREFIX=/opt/liuyh/mysql \   安装目录
-DSYSCONFDIR=/etc \   配置文件存放 （默认可以不安装配置文件）
-DMYSQL_DATADIR=/opt/liuyh/data \   数据目录   错误日志文件也会在这个目录
-DINSTALL_MANDIR=/usr/share/man \     帮助文档 
-DMYSQL_TCP_PORT=3306 \     默认端口
-DMYSQL_UNIX_ADDR=/tmp/mysql.sock \  sock文件位置，用来做网络通信的，客户端连接服务器的时候用
-DDEFAULT_CHARSET=utf8 \    默认字符集。字符集的支持，可以调
-DEXTRA_CHARSETS=all \   扩展的字符集支持所有的
-DDEFAULT_COLLATION=utf8_general_ci \  支持的
-DWITH_READLINE=1 \    上下翻历史命令
-DWITH_SSL=system \    使用私钥和证书登陆（公钥）  可以加密。 适用与长连接。坏处：速度慢
-DWITH_EMBEDDED_SERVER=1 \   嵌入式数据库
-DENABLED_LOCAL_INFILE=1 \    从本地倒入数据，不是备份和恢复。
-DWITH_INNOBASE_STORAGE_ENGINE=1  默认的存储引擎，支持外键
```
make && make install
```
8.创建软连接
```
ln -s /opt/vv/mysql/bin/mysql /usr/bin
```
9.更改创建的文件夹所属用户和所属组
```
chown -R sql:sql /opt/vv/{mysql,data,log}
```
10.配置参数
```
vi /etc/my.cnf
```
填写以下内容
```
[mysqld]
bind-address=0.0.0.0 
port=3306
user=mysql 
basedir=/opt/liuyh/mysql
datadir=/opt/liuyh/data/mysql 
socket=/tmp/mysql.sock 
log-error=/opt/liuyh/data/mysql/mysql.err
pid-file=/opt/liuyh/data/mysql/mysql.pid
#character config
character_set_server=utf8mb4
symbolic-links=0
plugin-load=validate_password.so
validate-password=ON 
```
11.初始化MySQL
>进入MySQL的bin目录
```
./mysqld --defaults-file=/etc/my.cnf --basedir=/opt/vv/mysql/ --datadir=/opt/vv/data/mysql/ --user=sql --initialize
```
12.查看临时密码
```
cat /opt/vv/data/mysql/mysql.err 
```
13.启动MySQL前先开放权限
```
cp /opt/vv/mysql/support-files/mysql.server /etc/init.d/mysqld 
```
```
chown 777 /etc/my.cnf 
```
```
chmod +x /etc/init.d/mysqld 
```
13.启动MySQL
```
service mysqld start
```
>关闭：service mysqld stop
14.登录MySQL修改密码
```
set password = password('AGLAREvv.1');
```
15.开启远程连接
```
use mysql
```
```
update user set Host='%' where user = "root";
```
```
flush privileges;
```
16.设置MySQL开机自启
```
chkconfig --add mysqld 
```






