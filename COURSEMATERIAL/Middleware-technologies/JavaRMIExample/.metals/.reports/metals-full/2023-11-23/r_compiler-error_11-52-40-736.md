file://<WORKSPACE>/JavaRMIServer/src/main/java/it/uniroma1/svriface/ServerInterface.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

action parameters:
offset: 825
uri: file://<WORKSPACE>/JavaRMIServer/src/main/java/it/uniroma1/svriface/ServerInterface.java
text:
```scala
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package it.uniroma1.svriface;

import java.rmi.Remote;
import java.rmi.RemoteException;
//with JavaRMI we focus on interfaces: the server now expose a simple interface
public interface ServerInterface extends Remote {

   int startTask() throws RemoteException; //we still need a way to identify clients
   boolean isReady(int id) throws RemoteException; //=getStatus (oss: is boolean)
   int[] getResults(int id) throws RemoteException; //the result is an array of integers
}

//oss: allowing us to forget about the implementation but go straight defining the interfaces we need to our middleware program logic
//oss: still need to (genera@@have a client that continuosly ask for the result: CAN'T JUST WAIT FOR IT!!
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
	scala.meta.internal.pc.SignatureHelpProvider$.signatureHelp(SignatureHelpProvider.scala:40)
	scala.meta.internal.pc.ScalaPresentationCompiler.signatureHelp$$anonfun$1(ScalaPresentationCompiler.scala:375)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator