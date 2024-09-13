# 安装步骤
1、依赖下载
```
yum install -y zlib zlib-devel openssl openssl-devel pcre pcer-devel wget httpd-tools vim gcc gcc-c++
```
2、nginx下载
```
wget https://nginx.org/download/nginx-1.26.2.tar.gz
```
3、解压
```
 tar -zxvf nginx-1.26.2.tar.gz
```
4、编译安装
```
make && make install
```
5、开启nginx
```
/usr/local/nginx/sbin/nginx
```
**至此完成**
