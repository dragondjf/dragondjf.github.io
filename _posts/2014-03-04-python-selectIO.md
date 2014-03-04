---
layout: default
title: python socket编程之select I/O
id: selectIO
---
python socket编程之select I/O
=======================================
###1. 概述
select最早于1983年出现在4.2BSD中，它通过一个select()系统调用来监视多个文件描述符的数组，当select()返回后，该数组中就绪的文件描述符便会被内核修改标志位，使得进程可以获得这些文件描述符从而进行后续的读写操作。

select目前几乎在所有的平台上支持，其良好跨平台支持也是它的一个优点，事实上从现在看来，这也是它所剩不多的优点之一。

select的一个缺点在于单个进程能够监视的文件描述符的数量存在最大限制，在Linux上一般为1024，不过可以通过修改宏定义甚至重新编译内核的方式提升这一限制。

另外，select()所维护的存储大量文件描述符的数据结构，随着文件描述符数量的增大，其复制的开销也线性增长。同时，由于网络响应时间的延迟使得大量TCP连接处于非活跃状态，但调用select()会对所有socket进行一次线性扫描，所以这也浪费了一定的开销。

###2. python中select的实现
在python中，select函数是一个对底层操作系统的直接访问的接口。它用来监控sockets、files和pipes，等待IO完成（Waiting for I/O completion）。当有可读、可写或是异常事件产生时，select可以很容易的监控到。 

+ 函数原型
    + select.select（rlist, wlist, xlist[, timeout]） 
    + 传递三个参数，一个为输入而观察的文件对象列表，一个为输出而观察的文件对象列表和一个观察错误异常的文件列表。第四个是一个可选参数，表示超时秒数。其返回3个list，每个list都是一个准备好的对象列表，它和前边的参数是一样的顺序。下面，主要结合代码，简单说说select的使用。 
    + 空序列也是允许的，但是能不能3个参数都为空就要由你的系统决定了。（众所都知unix下是行得，windows下不行）timeout指定了一个秒级的浮点型参数表示超时时间当timeout参数为空的时候省略了函数会阻塞直到至少有一个文件描述符已经准备好了。
    + 其中列表中可以接收的参数类型是Python中的文件参数（例如 sys.stdin 或者是 open() sys.popen()的返回对象），或者是 socket.socket的返回对象。你也可以自己封装成一个类，只要适合fileno()方法， 例如SocketServer就是传递的对象，对象定义了fileno()
    + **note**：在windows中文件对象是无法接受的，但是socket是可以使用的。

+ Server端程序: 
    + 1、该程序主要是利用socket进行通信，接收客户端发送过来的数据，然后再发还给客户端。 
    + 2、首先建立一个TCP/IP socket，并将其设为非阻塞，然后进行bind和listen。 
    + 3、通过select函数获取到三种文件列表，分别对每个列表的每个元素进行轮询，对不同socket进行不同的处理，最外层循环直到inputs列表为空为止 
    + 4、当设置timeout参数时，如果发生了超时，select函数会返回三个空列表。

###3.demo例程
server：   

        #create a socket
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setblocking(False)
        #set option reused
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
        server_address = ('127.0.0.1', 10001)
        server.bind(server_address)
    
        server.listen(10)
    
        #sockets from which we except to read
        inputs = [server]
    
        #sockets from which we expect to write
        outputs = []
    
        #Outgoing message queues (socket:Queue)
        message_queues = {}
    
        #A optional parameter for select is TIMEOUT
        timeout = 20
        print "server : %s" % repr(server)
        while True:
            print "\n\nwaiting for next event"
            readable, writable, exceptional = select.select(inputs, outputs, inputs, timeout)
            print u"***************监视的socket*************************"
            print "inputs: %s" % repr(inputs)
            print "outputs: %s" % repr(outputs)
            print u"***************可读可写异常socket*******************"
            print "readable socket: %s" % repr(readable)
            print "writable socket: %s" % repr(writable)
            print "exceptional socket: %s" % repr(exceptional)
            print u"***************处理相应的socket**********************"
            # When timeout reached, select return three empty lists
            if not (readable or writable or exceptional):
                print "Time out ! "
                break
            for s in readable:
                if s is server:
                    # A "readable" socket is ready to accept a connection
                    connection, client_address = s.accept()
                    print "%s  connection from " % repr(connection), client_address
                    connection.setblocking(0)
                    inputs.append(connection)
                    message_queues[connection] = Queue.Queue()
                else:
                    data = s.recv(1024)
                    if data:
                        print "%s received " % s, data, "from ", s.getpeername()
                        message_queues[s].put(data)
                        # Add output channel for response
                        if s not in outputs:
                            outputs.append(s)
                    else:
                        #Interpret empty result as closed connection
                        print "  closing", s.getpeername()
                        if s in outputs:
                            outputs.remove(s)
                        if s in inputs:
                            inputs.remove(s)
                        s.close()
                        #remove message queue
                        del message_queues[s]
            for s in writable:
                if s in message_queues:
                    try:
                        next_msg = message_queues[s].get_nowait()
                    except Queue.Empty:
                        print " ", s.getpeername(), 'queue empty'
                        outputs.remove(s)
                    else:
                        print " sending ", next_msg, " to ", s.getpeername()
                        s.send(next_msg)
    
            for s in exceptional:
                print " exception condition on ", s.getpeername()
                #stop listening for input on the connection
                inputs.remove(s)
                if s in outputs:
                    outputs.remove(s)
                s.close()
                #Remove message queue
                del message_queues[s]

client:     

        import socket
        
        # messages = ["This is the message",
        #             "It will be sent",
        #             "in parts "]
        messages = ['hello world']
        
        print "Connect to the server"
        
        server_address = ("127.0.0.1", 10001)
        
        #Create a TCP/IP sock
        
        socks = []
        
        for i in range(10):
            socks.append(socket.socket(socket.AF_INET, socket.SOCK_STREAM))
        
        for s in socks:
            s.connect(server_address)
        
        counter = 0
        for message in messages:
            #Sending message from different sockets
            for s in socks:
                counter += 1
                print "  %s sending %s" % (s.getpeername(), message + " version " + str(counter))
                s.send(message+" version "+str(counter))
            #Read responses on both sockets
            for s in socks:
                data = s.recv(1024)
                print " %s received %s" % (s.getpeername(), data)
                if not data:
                    print "closing socket ", s.getpeername()
                    s.close()

更多详情参见[Python网络编程中的select 和 poll I/O复用的简单使用][select]

[select]: http://www.cnblogs.com/coser/archive/2012/01/06/2315216.html