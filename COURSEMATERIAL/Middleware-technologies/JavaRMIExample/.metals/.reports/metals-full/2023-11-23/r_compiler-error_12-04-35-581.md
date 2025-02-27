file://<WORKSPACE>/JavaRMIServer/src/main/java/it/uniroma1/javarmiserver/exrmisvr/ServerImpl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

action parameters:
offset: 466
uri: file://<WORKSPACE>/JavaRMIServer/src/main/java/it/uniroma1/javarmiserver/exrmisvr/ServerImpl.java
text:
```scala
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package it.uniroma1.javarmiserver.exrmisvr;

import it.uniroma1.svriface.ServerInterface;
import java.rmi.*;
import java.util.*;

public class ServerImpl implements ServerInterface {

    Hashtable<Integer, ServerThread> threadPool;
    int allocatedThreads;
    
    public Server@@Impl() {
        this.threadPool = new Hashtable<Integer,ServerThread>();
        this.allocatedThreads = 0;
    }

    @Override
    public int startTask() throws RemoteException {
        System.out.println("RMI Server" + Thread.currentThread() + "e' stato richiesto startTask() ...");
        
        ServerThread st = new ServerThread();
        Thread t = new Thread(st);
        threadPool.put(allocatedThreads, st);
        t.start();
        allocatedThreads = allocatedThreads + 1;
        return (allocatedThreads-1);
    }

    public boolean isReady(int i) throws RemoteException {
        //System.out.println("RMI Server" + Thread.currentThread() + "e' stato richiesto isReady() ...");
        return threadPool.get(i).isRunning();
    }

    public int[] getResults(int i) throws RemoteException {
        System.out.println("RMI Server" + Thread.currentThread() + "e' stato richiesto getResults() ...");
        return threadPool.get(i).getResult();
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