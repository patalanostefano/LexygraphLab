file://<WORKSPACE>/src/main/java/it/uniroma1/grpcexampleserver/HelloServiceImpl.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

action parameters:
offset: 694
uri: file://<WORKSPACE>/src/main/java/it/uniroma1/grpcexampleserver/HelloServiceImpl.java
text:
```scala
package it.uniroma1.grpcexampleserver;

import io.grpc.stub.StreamObserver;
import it.uniroma1.gRPCExample.HelloRequest;
import it.uniroma1.gRPCExample.HelloResponse;
import it.uniroma1.gRPCExample.HelloServiceGrpc.HelloServiceImplBase;

//the implementation: observer-observable  (a pattern allowin you to monitor programs with asynchronous programming)

public class HelloServiceImpl extends HelloServiceImplBase {

    @Override
    public void hello(
      HelloRequest request, StreamObserver<HelloResponse> responseObserver) {

        System.out.println("... the server has received: " + request.getFirstName() + " " + request.getLastName());
        
        String greeting = new Strin@@gBuilder()
          .append("Hello, ")
          .append(request.getFirstName())
          .append(" ")
          .append(request.getLastName())
          .toString();

        HelloResponse response = HelloResponse.newBuilder()
          .setGreeting(greeting)
          .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
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