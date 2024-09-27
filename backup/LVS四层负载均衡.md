# LVS四层负载均衡
## NET转发模式
<details>
<summary>配置步骤</summary>
 
  >

1、lvs-server下载ipvsadm
  ```
  yum install -y ipvsadm
  ```
2、启动路由转发功能
```
echo 1 > /proc/sys/net/ipv4/ip_forward
```
3、配置对外的ip
>-A 添加一个VIP
-t TCP协议
-s   schedule调度
-rr  轮巡策略类型
```
ipvsadm -A -t 192.168.209.143:80  -s rr
```
4、添加真实服务器ip
>-a  添加一个真实lvs服务ip
-r  真实服务器IP 地址
-m    指定调度算法为“轮询”模式,即请求将被均匀地分发到配置的所有真实服务器上。
真实服务器设置为仅主机模式
```
ipvsadm -a -t 192.168.209.143:80 -r 192.168.200.4:80 -m
```
5、查看配置策略
```
ipvsadm -Ln
```
6、查看测试结果
>打开浏览器输入lvs-server地址进行测试
```
ipvsadm -Lnc
```
**至此结束**
</details>

## DR直接路由模式
<details>
<summary>配置步骤</summary>

>



</details>