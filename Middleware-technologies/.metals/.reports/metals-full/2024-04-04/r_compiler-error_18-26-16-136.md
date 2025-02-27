file://<WORKSPACE>/SocketExample/SocketServer/src/main/java/it/uniroma1/socketserver/ServerMain.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:
Scala version: 3.3.1
Classpath:
<HOME>/Library/Caches/Coursier/v1/https/repo1.maven.org/maven2/org/scala-lang/scala3-library_3/3.3.1/scala3-library_3-3.3.1.jar [exists ], <HOME>/Library/Caches/Coursier/v1/https/repo1.maven.org/maven2/org/scala-lang/scala-library/2.13.10/scala-library-2.13.10.jar [exists ]
Options:



action parameters:
offset: 437
uri: file://<WORKSPACE>/SocketExample/SocketServer/src/main/java/it/uniroma1/socketserver/ServerMain.java
text:
```scala
package it.uniroma1.socketserver;

import java.io.*;
import java.net.*;
import java.util.*;

public class ServerMain {

    public static void main(String[] args) {

        List<ClientThread> ctList = new ArrayList<ClientThread>();   //list of the client threads the server serve
        ServerSocket lis = null;    

        try {
            lis = new ServerSocket(Integer.parseInt(args[0]));  //start a new server socke@@t (arg is the port)
        } catch (IOException e1) {
            System.out.println("Errore nella creazione del ServerSocket, applicazione dismessa");
            System.exit(1);
        }
        System.out.println("Server avviato");
        Socket sock = null;

        while (true) {
            try {
                sock = lis.accept();       //acceping the client request 
            } catch (IOException e) {
                break;
            }
            System.out.println("Socket creata, connessione accettata");
            ClientThread cl = new ClientThread(sock);  //creating the thread for that client
            Thread tr = new Thread(cl);
            tr.start();
            ctList.add(cl);
        }
    }

}

```



#### Error stacktrace:

```
scala.collection.Iterator$$anon$19.next(Iterator.scala:973)
	scala.collection.Iterator$$anon$19.next(Iterator.scala:971)
	scala.collection.mutable.MutationTracker$CheckedIterator.next(MutationTracker.scala:76)
	scala.collection.IterableOps.head(Iterable.scala:222)
	scala.collection.IterableOps.head$(Iterable.scala:222)
	scala.collection.AbstractIterable.head(Iterable.scala:933)
	dotty.tools.dotc.interactive.InteractiveDriver.run(InteractiveDriver.scala:168)
	scala.meta.internal.pc.MetalsDriver.run(MetalsDriver.scala:45)
	scala.meta.internal.pc.HoverProvider$.hover(HoverProvider.scala:34)
	scala.meta.internal.pc.ScalaPresentationCompiler.hover$$anonfun$1(ScalaPresentationCompiler.scala:352)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator