<details>
<summary>Linux系统管理</summary>

>

1、Linux中链接的分类？
- 分为软、硬链接，命令：分别为 ln -s 和 ln

2、编写好的shell程序在运行前要赋予什么权限？
- 赋予执行权限，命令： chmod +x 文件名

3、唯一辨识每个用户的方法？
- 根据uid和用户名，命令 id查看

4、在Linux系统中，存放系统所需要的配置文件和子目录的目录是？
- /etc

5、结束后台进程命令？
- kill -9 进程号

6、在超级用户下显示正在运行的全部进程使用的命令？
- ps -ef

7、删除文件和目录命令？
- rm -rf

8、移动文件和目录命令？
- mv

9、增加一个用户命令？
- useradd

10、终止一个前台进程可能用到的命令和操作？
- kill

11、使用mkdir创建目录时，父目录不存在，如何创建？
- mkdir -p 目录

12、文件名为test.tar.gz，如何解压缩？
- tar -zxvf

13、一台计算机内存为128MB，交换分区的大小通常是？
- 64MB

14、将光盘（CD-ROM）hdc 挂载到文件系统的/mnt/cdrom/目录的命令？
- mount /dev/hdc /mnt/cdrom

15、描述一下归档和压缩？
- unzip和gzip命令可以压缩相同类型的文件

16、描述raid0、1、5的特点和优点？
- raid0：最少要2块磁盘、数据条带式分布、没有冗余，性能最佳：因为不存储镜像和检验信息、不能应用于对数据安全性较高的场合
- raid1：最少要2块磁盘、提供数据冗余、性能好
- raid5：最少要3块磁盘、数据条带式分布、用奇偶校验作冗余、适合读多写少的场景：是性能与数据冗余最佳的折中方案

17、在/etc/fstab 文件中指定的文件系统加载参数，什么参数用于CD-ROM？
- noauto，表示手动挂载

18、Linux文件权限一共10位长度，分成四段，第三段表示？
- 文件所有者所在组的权限

19、如何判断windows操作系统是32位还是64位？
- 在【我的电脑】属性中查看

20、Linux系统关机、重启、文件赋权命令？
- poweroff、reboot、chmod

21、Linux系统查看定时任务命令？
- crontab -l

22、Linux系统查看MAC地址？
- ip a

23、Linux系统新建一个叫oracle的用户的命令？设置密码？
- useradd oracle 
- passwd oracle

24、Linux从ip为10.0.4.100远程主机复制/root/script.sh文件到/databases/oracle的命令？
- scp 10.0.4.100:/root/script.sh /databases/oracle

25、Linux系统查看进程中含有oracle关键字的进行信息？杀死进程id为29324的命令？
- ps aux | grep oracle
- kill -9 29324

26、查看Linux系统的磁盘空间情况？将/dev/sdb文件系统挂载到/data2目录下？
- df -Th
- mount /dev/sdb /data2

27、输出数字0到100中3的倍数？
```
for i in {1..100}
do
 if [[$(($i % 3)) -eq 0 ]]; then
    echo $i
 fi
done
```
28、假设服务器有6快900G本地硬盘，单块硬盘io约为150M/S，现对硬盘进行RAID划分，6快盘做成RAID5级别后实际存储大小？理论实际io大小？
```
理论上6块盘做raid5，1块做冗余，因为有检验位。
所以实际大小：900 * （6-2） = 3600G
实际写：150 * 4 = 600M/S
实际读：150 * (6-1) = 750M/S
```
29、http、https、ftp、mysql、redis的默认端口号？
- 80 443 21 3306 6379

30、硬盘2T，内存32G 和 硬盘6T，内存128G如何分区？
- boot 50m swap 64G / 500G /home 1T /var 剩余
- boot 50m swap 256G / 1T /home 4.5G /var 剩余

31、Linux系统统计服务器服务连接数量？
- w
- netstat -an|awk '/tcp/ {print $6}'|sort|uniq -c

32、简述各个命令或工具的主要功能作用？
（grep、netstat、sed、awk、sort、wc、tcpdump、tail、ldd、uniq）
```
grep：过滤
netstat：检查网络和端口
sed：流文本编辑
awk：字符处理
sort：排序
wc：统计字符
tcpdump：抓包
tail：从尾行查看
ldd：列出程序所需要的动态链接库
uniq：检查重复行
```
33、Linux查询某文件路径？
- find

34、raid类型？
- raid0、raid1、raid5、raid10

35、Linux默认的定时任务，一般写入哪个文件？
- /etc/crontab

36、http的错误代码含义？
```
404：找不到页面
410：被请求的资源在服务器上不再可用
502：网关错误
504：网关超时
```
37、使用awk、sed、grep举例写出命令？
- awk -F':' '{print $1}' filename
- sed -i.bak 's/a/A/' filename
- grep 'hello world' filename

38、tcp三次握手过程？
```
tcp提供可靠连接。
第一次握手：建立连接时，客户端发送syn（同步序列编号（Synchronize Sequence Numbers））包（syn=j）到服务器，并进入SYN_SEND状态，等待服务器确认。

第二次握手：服务器收到syn包，必须确认客户的SYN（ack=j+1），同时自己也发送一个SYN包（syn=k），即SYN+ACK包，此时服务器进入SYN_RECV状态。

第三次握手：客户端收到服务器的SYN+ACK包，向服务器发送确认包ACK（ack=k+1），发送完毕，客户端和服务器进入ESTABLISHED状态，完成三次握手，开始传输数据
```
39、二层交换机和三层交换机的区别？
```
二层交换机工作于OSI模型的第2层（数据链路层），故称为二层交换机

三层交换机最重要目的是加快大型局域网内部的数据交换，所具有的路由功能也是为这目的服务的，能够做到一次路由，多次转发。对于数据包转发等规律性的过程由硬件高速实现，而像路由信息更新、路由表维护、路由计算、路由确定等功能，由软件实现。三层交换技术就是二层交换技术+三层转发技术。
```
40、centos7默认防火墙允许80端口外网访问，写出相应安全策略？
- firewall-cmd --zone=public --add-port=80/tcp --permanent

41、使用tcpdump监听tcp80端口来自192.168.0.1的所有流量？
- tcpdump -i eth0 host 192.168.0.1 port 80 
- tcpdump src 192.168.1.10 tcp port 80



</details>
