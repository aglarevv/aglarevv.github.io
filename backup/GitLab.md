## GitLab部署步骤：

1、关闭防火墙
2、下载依赖

```
yum install -y  curl policycoreutils openssh-server openssh-clients  postfix
```

3、设置开机自启

```
systemctl enable sshd
systemctl start sshd
systemctl enable postfix
systemctl start postfix
```

4、下载gitlab，下载连接（夸克网盘）：[gitlab-ce-9.1.0-ce.0.el7.x86_64.rpm](https://pan.quark.cn/s/a3a0509d91db)
5、解压

```
yum -y install gitlab-ce-9.1.0-ce.0.el7.x86_64.rpm
```

6、重新配置

```
gitlab-ctl reconfigure
```

7、进入gitlab服务器地址（本机ip:80）后，设置完密码使用root登录即可完成部署
![image](https://github.com/user-attachments/assets/697e903c-5c92-4019-9000-e40d35ffa516)

