file://<WORKSPACE>/SocketExample/SocketServer/src/main/java/it/uniroma1/socketserver/ServantThread.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:
Scala version: 3.3.1
Classpath:
<HOME>/Library/Caches/Coursier/v1/https/repo1.maven.org/maven2/org/scala-lang/scala3-library_3/3.3.1/scala3-library_3-3.3.1.jar [exists ], <HOME>/Library/Caches/Coursier/v1/https/repo1.maven.org/maven2/org/scala-lang/scala-library/2.13.10/scala-library-2.13.10.jar [exists ]
Options:



action parameters:
offset: 676
uri: file://<WORKSPACE>/SocketExample/SocketServer/src/main/java/it/uniroma1/socketserver/ServantThread.java
text:
```scala
package it.uniroma1.socketserver;

import java.util.Arrays;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *  //this is the buisiness logic: (just simulate a long running task: 30 sec)
 * @author biar
 */
public class ServantThread implements Runnable {
    
    private boolean running = false;
    private int[] result;
    
    private synchronized void atomicAction(int i) {
        Double random = Math.random();
        int j = (int) (random * 10);
        result[i] = j;
        System.out.println(Thread.currentThread() + " ... sto lavorando e produco " + j);
    }
    //it's a common skeleton: run(the actual business code), running(to check @@if is running or not), getresult(prepare the 10 numbers result)
    @Override
    public void run() {
        System.out.println(Thread.currentThread() + " inizia a lavorare");
        running = true;
        result = new int[10];
        for (int i=0; i<10; i++) {
            try {
                Thread.sleep(3000);
            } catch (InterruptedException ex) {
                Logger.getLogger(ServantThread.class.getName()).log(Level.SEVERE, null, ex);
            }
            atomicAction(i);
        }
        
        System.out.println(Thread.currentThread() + " smette di lavorare");
        System.out.println(Thread.currentThread() + " sta per tornare il risultato " + Arrays.toString(result));
        running = false;
    }
    public synchronized boolean isRunning() {
        return running;
    }
    
    public synchronized int[] getResult() {
        System.out.println(Thread.currentThread() + " sta per tornare il risultato " + Arrays.toString(result));
        if (running == false) return result;
        else return null;
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