file://<WORKSPACE>/JavaRMIClient/src/main/java/it/uniroma1/javarmiclient/exrmicl/ExRMICl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

action parameters:
offset: 367
uri: file://<WORKSPACE>/JavaRMIClient/src/main/java/it/uniroma1/javarmiclient/exrmicl/ExRMICl.java
text:
```scala
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package it.uniroma1.javarmiclient.exrmicl;

import it.uniroma1.svriface.ServerInterface;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.util.@@Arrays;


/**
 *
 * @author biar
 */
public class ExRMICl {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) throws Exception {
        Registry registry = LocateRegistry.getRegistry("localhost", 5555);
        ServerInterface stub = (ServerInterface) registry.lookup("Server");
        int myID = stub.startTask();
        Thread.sleep(1000);
        while ( stub.isReady(myID) ) 
        {
            System.out.println("... sto aspettando ...");
            Thread.sleep(1000);
        }
        System.out.println(Arrays.toString(stub.getResults(myID)));
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