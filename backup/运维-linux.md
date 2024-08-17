top命令：动态监控系统资源
```
top -d 1：每秒刷新
P：按cpu使用率排序
M：按内存使用率排序
```
校对时间：

> 使用ntp工具进行校对

```
yum install ntp -y
ntpdate cn.pool.ntp.org
```
循环调度任务：

> cronie工具包里的组件

```
yum install cronie -y
crontab -e 进入编辑界面
```
tail命令：查看文件尾部
```
tail -f 动态查看
```
日志轮转：
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
sed命令：字符流编辑器

> 操作、过滤、转换文本内容的工具，配合正则对文件实现快速增删查改

```
sed -n "p" file ：打印文件所有行
sed -i "s/**/**/g" file ：修改文件
```
awk命令：文本格式化，转换为标准的excel表样式
HP服务器硬盘位置：
```
/dev/cciss/c0d0p1：c0是第一个控制器，d0是第一块磁盘，p1是分区1
```



