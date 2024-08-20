多虚拟主机配置：
```
> 多端口
1. 不同server监听不同端口
> 多ip
1.添加虚拟ip： ifconfig 虚拟网卡名称 ip
2.不同server监听不同ip:port
3.关闭nginx并重新启动
```
location匹配机制：

> **匹配优先级按序递减**

```
1. = 精确匹配
2. ^~ 以某开头，不支持正则
3. ~* 支持正则
4. 空 路径匹配
5. / 通配
```
状态页配置：

> 在location中添加：

```
stub_status on; #开启状态页
access_log off; #关闭日志
```
目录浏览：

> 在location中添加：

- 并且不允许有默认访问路径index
- 二者不能同时存在
```
autoindex on; 
```
静态资源压缩：

> 在nginx配置文件中http中添加：

```
gzip on;
gzip_http_version 1.1;
gzip_comp_level 4;
gzip_types text/plain application/javascript application/x-javascript
text/css application/xml text/javascript application/x-httpd-php image/jpeg
image/gif image/png;
```
url重写：
```
在location中添加：rewrite ^/(.*) 要转发的url/$1 flag标记
flag：
1. last 匹配最后一个符合的
2. break 匹配第一个符合的
3. redirect 临时重定向，爬虫不更新
4. permanent 永久重定向，爬虫更新
```
访问认证：

> 需下载httpd-tools工具包

```
执行命令： htpasswd -bc 存放文件位置 用户名 密码
配置文件location中添加：
auth_basic "sample auth";
auth_basic_user_file 上面生成的文件位置；
```
反向代理集群配置：

> weight:	内容为数字，权重比，数字越大，所获得的请求越多
> max_fails: 内容为数字，nginx尝试连接该节点的失败次数
> fail_timeout: 内容为数字单位秒，与失败次数联合使用，到达上述失败次数后间隔多长再次请求
> backup: 备份机，当其他非备份机无法使用时请求分到备份机，在使用ip_hash时无效

```
upstream  my_cluster{
    server 192.168.209.138 weight=1 max_fails=1 fail_timeout=10s backup;
}

localtion /{
    proxy_pass http://my_cluter;
}
```
负载均衡策略：
```
轮询：默认
权重：使用较多
ip_hash：临时存储，使用redis代替
fair：智能加载
least_conn：最闲连接
url_hash：固定业务，用于分布式微服务
```