## 什么是数据库？
数据库是专门用于存放计算机数据的软件仓库，这个仓库安装一定的数据结构对数据进行组织和存储
## 数据库的分类
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

## SQL分类：
DQL：数据查询语言：查询操作的SQL
DCL：数据控制语言，设定用户及权限的SQL
DDL：数据定义语言：表、序列、视图、索引的创建和销毁的SQL
DML：数据操作语言：CRUD
TCL：事务控制语言：控制事务的SQL



## MySQL安装

<details>
<summary>MySQL安装步骤：</summary>

1. 清理环境
```
yum erase mariadb mariadb-server mariadb-libs mariadb-devel -y
```
8.创建用户
```
useradd -r sql -M -s /sbin/nologin
```
9.下载源码
```
wget https://downloads.mysql.com/archives/get/p/23/file/mysql-5.7.26.tar.gz
```

> 二进制安装使用下面的命令（可选），如使用二进制安装，跳过第4，7步

```
wget https://downloads.mysql.com/archives/get/p/23/file/mysql-5.7.26-linux-glibc2.12-x86_64.tar.gz
```
10.安装编译工具
```
yum -y install ncurses ncurses-devel openssl-devel bison gcc gcc-c++ make cmake
```
11.创建MySQL目录
```
mkdir -p /opt/vv/{data,mysql,log}
```
12.解压
```
tar xzvf mysql-5.7.26.tar.gz -C /opt/vv/
```

> 二进制方式安装使用下面的命令解压并移动

```
tar xzvf mysql-5.7.26-linux-glibc2.12-x86_64.tar.gz 
mv mysql-5.7.26-linux-glibc2.12-x86_64/* /opt/vv/mysql
```
13.编译安装
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

> 如因网络问题boost库无法自动下载，可手动下载后将压缩包移动到 -DWITH_BOOST 参数所指定的目录下。
删除 -DDOWNLOAD_BOOST 和 -DWITH_BOOST参数
**不用解压！！！**

```
make && make install
```

14.创建软连接
```
ln -s /opt/vv/mysql/bin/mysql /usr/bin
```
15.更改创建的文件夹所属用户和所属组
```
chown -R sql:sql /opt/vv/{mysql,data,log}
```
16.配置参数
```
vi /etc/my.cnf
```
填写以下内容
```
[mysqld]
bind-address=0.0.0.0 
port=3306
user=sql 
basedir=/opt/vv/mysql
datadir=/opt/vv/data/mysql 
socket=/tmp/mysql.sock 
log-error=/opt/vv/data/mysql/mysql.err
pid-file=/opt/vv/data/mysql/mysql.pid
#character config
character_set_server=utf8mb4
symbolic-links=0
plugin-load=validate_password.so
validate-password=ON 
```
17.初始化MySQL
>进入MySQL的bin目录
```
./mysqld --defaults-file=/etc/my.cnf --basedir=/opt/vv/mysql/ --datadir=/opt/vv/data/mysql/ --user=sql --initialize
```
18.查看临时密码
```
cat /opt/vv/data/mysql/mysql.err 
```
19.启动MySQL前先开放权限
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
20.登录MySQL修改密码
```
set password = password('AGLAREvv.1');
```
21.开启远程连接
```
use mysql
```
```
update user set Host='%' where user = "root";
```
```
flush privileges;
```
22.设置MySQL开机自启
```
chkconfig --add mysqld 
```
</details>

## 数据备份

<details>
<summary>使用select into命令备份</summary>

> 是sql中的一个基础命令，可以完成数据备份，但是由于十分简陋，只能适用于临时的数据备份

查看权限：
```
show variables like '%secure%';
```
> secure_file_priv为NULL表示当前不可用select into进行备份

进入进入/etc/my.cnf，添加配置
```
secure-file-priv=/tmp
```
重启MySQL，重新查看权限，value值为/tmp/表示只能备份在此目录下。
执行select into命令
```
select * from t_user into outfile '/tmp/user.txt'
```
> 语法：select 语句 into outfile '目标文件'
将select的查询结果数据储存到/tmp/user.txt

恢复数据：
```
load data infile '/tmp/user.txt' into table t_user;
```
</details>

<details>
<summary>使用xtrabackup工具备份</summary>

1.下载：
```
wget https://www.percona.com/downloads/XtraBackup/Percona-XtraBackup-2.4.9/binary/redhat/6/x86_64/Percona-XtraBackup-2.4.9-ra467167cdd4-el6-x86_64-bundle.tar
```
2.解压：
```
tar xvf Percona-XtraBackup-2.4.9-ra467167cdd4-el6-x86_64-bundle.tar
```
3.安装：
```
yum install  percona-xtrabackup-24-2.4.9-1.el6.x86\_64.rpm -y
```
### 三种备份方式：
**4-1.完整备份**

- 创建备份
1. 创建备份目录
```
mkdir /xtrabackup/full -p
```
2. 执行备份命令
```
innobackupex --user=root --password='AGLAREvv.1' -S /tmp/mysql.sock  /xtrabackup/full
```
> --user: 数据库登陆用户名
--password: 密码
-S :数据库套接文件地址，在/etc/my.cnf的socket中获取

- 恢复备份
1. 关闭数据库
2. 删除数据库所有数据
3. 重演数据
```
innobackupex --apply-log /xtrabackup/full/2021-11-17_00-37-48
```

4. 恢复数据

```
innobackupex --copy-back /xtrabackup/full/2021-11-17_00-37-48
```

5. 查看数据库储存位置是否有数据文件
6. 设置权限，将恢复后的文件权限设置为MySQL数据的拥有者可执行权限

```
chown -R sql:sql /opt/vv/data/mysql/*
```

7. 启动数据库

**4-2.增量备份**
- 创建备份

1. 先创建完整备份
2. 修改数据库数据
3. 创建增量备份
```
innobackupex --user=root --password='AGLAREvv.1' -S /tmp/mysql.sock --incremental /xtrabackup/full --incremental-basedir=/xtrabackup/full/2023-11-17_15-57-12
```

> --incremental：指定增量备份生成位置
--incremental-basedir：指定以哪个备份为基础做增量备份，注意：所选备份应为一个完整备份或增量备份

- 恢复备份

1. 关闭数据库
2. 删除数据库所有数据
3. 重演数据
```
innobackupex --apply-log --redo-only /xtrabackup/full/2021-11-17_15-57-12
```

4. 整合数据
```
innobackupex --apply-log --redo-only /xtrabackup/full/2021-11-17_15-57-12 --incremental-dir=/xtrabackup/full/2021-11-17_16-01-25
```
>前面的是完整备份，后面的是增量备份

5. 恢复数据，所有数据都在完整备份中，恢复完整备份即可
```
innobackupex --copy-back /xtrabackup/full/2021-11-17_15-57-12 
```
6. 设置权限
```
chown -R sql:sql /opt/vv/data/mysql/*
```
7. 启动数据库，查看数据

**4-3.逻辑备份**
- 使用mysqldump工具，是MySQL自带的逻辑备份工具
>本身为客户端工具:
远程备份语法: # mysqldump  -h 服务器  -u用户名  -p密码  数据库名  > 备份文件.sql
本地备份语法: # mysqldump  -u用户名  -p密码   数据库名  > 备份文件.sql

1. 创建备份目录
```
mkdir /mysql_backup
```
2. 备份当前数据库所有数据
> 执行MySQL安装目录下bin目录中的mysqldump

```
mysqldump -u root -p -A > /mysql_backup/all.sql
```
> 参数解释：
-A, --all-databases #备份所有库
-B, --databases  #备份多个数据库
--tables：指定表
-F, --flush-logs #备份之前刷新binlog日志
--default-character-set #指定导出数据时采用何种字符集，如果数据表不是采用默认的latin1字符集的话，那么导出时必须指定该选项，否则再次导入数据后将产生乱码问题。
--no-data，-d #不导出任何数据，只导出数据库表结构。
--lock-tables #备份前，锁定所有数据库表
--single-transaction #保证数据的一致性和服务的可用性
-f, --force #即使在一个表导出期间得到一个SQL错误，继续。
着重强调：
使用 mysqldump 备份数据库时避免锁表:
对一个正在运行的数据库进行备份请慎重，尽量不要在数据库开放服务时备份，如果一定要在服务运行期间备份，可以选择添加 --single-transaction选项，
类似执行： mysqldump --single-transaction -u root -p dbname > mysql.sql

3. 查看是否生成文件




</details>



