file://<WORKSPACE>/SocketClient/src/main/java/it/uniroma1/socketclient/Main.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

action parameters:
offset: 1304
uri: file://<WORKSPACE>/SocketClient/src/main/java/it/uniroma1/socketclient/Main.java
text:
```scala
package it.uniroma1.socketclient;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.Socket;
import java.util.ArrayList;
import java.util.Scanner;

public class Main {

    public static void main(String[] args) throws IOException, InterruptedException {
        Socket sock = new Socket(args[0], Integer.parseInt(args[1]));  //binding method: return when server side accept
        OutputStream os = sock.getOutputStream();
        PrintWriter netPw = new PrintWriter(new OutputStreamWriter(os));
        Scanner scan = new Scanner(sock.getInputStream());      //write and read methods (from and to the socket)

        System.out.println(".. sto per mandare start ...");
        netPw.println("start");     //a little timeout between every checking
        netPw.flush();
        Thread.sleep(1500);
        
        
        boolean finished = false;
        while (!finished) {
            System.out.println(".. sto per chiedere getStatus ...");
            netPw.println("getStatus");
            netPw.flush();
            String cmd = scan.nextLine();
            System.out.println(".. ho ricevuto " + cmd);
            if (cmd.equals("finished")) {
                finished = true;
            }
            @@Thread.sleep(1500);
        }       //when received finish i can ask for the result:

        ArrayList resultBuffer = new ArrayList();
        System.out.println(".. sto per chiedere getResult ...");
        netPw.println("getResult");
        netPw.flush();
        boolean goon = true;
        while (goon) {
            String cmd = scan.nextLine();
            if (cmd.equals("###")) {
                goon = false;
            } else {
                resultBuffer.add(Integer.parseInt(cmd));
            }
        }
        
        System.out.println(resultBuffer);
        
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
	scala.meta.internal.pc.ScalaPresentationCompiler.hover$$anonfun$1(ScalaPresentationCompiler.scala:329)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator