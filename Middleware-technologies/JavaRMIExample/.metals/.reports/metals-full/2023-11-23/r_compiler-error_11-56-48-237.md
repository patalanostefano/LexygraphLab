file://<WORKSPACE>/JavaRMIServer/src/main/java/it/uniroma1/javarmiserver/exrmisvr/ServerMain.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

action parameters:
offset: 862
uri: file://<WORKSPACE>/JavaRMIServer/src/main/java/it/uniroma1/javarmiserver/exrmisvr/ServerMain.java
text:
```scala
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package it.uniroma1.javarmiserver.exrmisvr;

import it.uniroma1.svriface.ServerInterface;
import java.rmi.registry.*;
import java.rmi.server.*;

public class ServerMain {

    public static void main(String[] args) {
        try {
            ServerImpl obj = new ServerImpl();  //defining an object that will be the implementation of Serverinterface
            ServerInterface stub = (ServerInterface) UnicastRemoteObject.exportObject(obj, 0);

            // Bind the remote object's stub in the registry
            Registry registry = LocateRegistry.createRegistry(5555);    //in middleware tech we need a standard trusted third party we trust that maps the Server names a@@nd client goes to find it
            registry.rebind("Server", stub);    //the object stub will be mapped in the registry with the name "Server"

            System.out.println("Server ready");
        } catch (Exception e) {
            System.err.println("Server exception: " + e.toString());
            e.printStackTrace();
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
	scala.meta.internal.pc.ScalaPresentationCompiler.hover$$anonfun$1(ScalaPresentationCompiler.scala:329)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator