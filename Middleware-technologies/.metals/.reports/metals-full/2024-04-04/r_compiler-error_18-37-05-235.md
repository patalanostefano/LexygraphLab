file://<WORKSPACE>/SocketExample/SocketServer/src/main/java/it/uniroma1/socketserver/ClientThread.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:
Scala version: 3.3.1
Classpath:
<HOME>/Library/Caches/Coursier/v1/https/repo1.maven.org/maven2/org/scala-lang/scala3-library_3/3.3.1/scala3-library_3-3.3.1.jar [exists ], <HOME>/Library/Caches/Coursier/v1/https/repo1.maven.org/maven2/org/scala-lang/scala-library/2.13.10/scala-library-2.13.10.jar [exists ]
Options:



action parameters:
offset: 593
uri: file://<WORKSPACE>/SocketExample/SocketServer/src/main/java/it/uniroma1/socketserver/ClientThread.java
text:
```scala
package it.uniroma1.socketserver;

import java.io.*;
import java.net.*;
import java.util.*;
//the thread implement three funcnionalities: start get-status get-result => how to implement it
//must code a socket PROTOCOL
public class ClientThread implements Runnable {

    private Socket sock;
    private ServantThread st = null;
    private boolean running = false;

    public ClientThread(Socket s) {
        sock = s;
    }

    @Override
    public void run() {

        boolean running = true;
        Scanner in = null;
        PrintWriter pw = null;
        try @@{
            in = new Scanner(sock.getInputStream());
            pw = new PrintWriter(sock.getOutputStream());
        } catch (IOException e) {
            System.out.println("Errore nel client thread" + Thread.currentThread());
        }
        try {
            while (running) {
                String cmd = in.nextLine();
                System.out.println("Ricevuto: " + cmd);
                if (cmd.equals("start")) {
                    st = new ServantThread();
                    Thread t = new Thread(st);
                    t.start();
                } else if (cmd.equals("getStatus")) {
                    String out;
                    if (st.isRunning()) {
                        out = "running";
                    } else {
                        out = "finished";
                    }
                    pw.println(out);
                    pw.flush();
                    System.out.println("Sto mandando: " + out);
                } else if (cmd.equals("getResult")) {
                    for (int n : st.getResult()) {  //marshalling: a way to format the server response data in a way that the client can handle
                        pw.println(String.valueOf(n));
                        pw.flush();    
                    }
                    running = false;
                    pw.println("###");
                    pw.flush();
                }
            }
            sock.close();
            pw.close();
            in.close();

        } catch (Exception ex) {
            System.out.println("Errore nel client thread" + Thread.currentThread());
            ex.printStackTrace();
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