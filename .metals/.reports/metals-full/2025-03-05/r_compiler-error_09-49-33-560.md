file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/dto/ProcessRequestDto.java
### java.util.NoSuchElementException: next on empty iterator

occurred in the presentation compiler.

presentation compiler configuration:


action parameters:
offset: 761
uri: file://<WORKSPACE>/src/document-service/src/main/java/com/lexygraphai/document/dto/ProcessRequestDto.java
text:
```scala
package com.lexygraphai.document.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Base class for document processing requests
 */
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = AgentProcessRequest.class, name = "AGENT"),
        @JsonSubTypes.Type(value = WorkflowProcessRequest.class, name = "WORKFLOW")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class ProcessRequest {
    private Map<String, Object> parameters;
}

package com.lexygraphai.document.dto;

import jakarta.va@@lidation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request for processing a document with a specific agent
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class AgentProcessRequest extends ProcessRequest {
    @NotNull(message = "Agent ID is required")
    private String agentId;
    
    public AgentProcessRequest(String agentId, Map<String, Object> parameters) {
        super(parameters);
        this.agentId = agentId;
    }
}

package com.lexygraphai.document.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request for processing a document with a workflow
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowProcessRequest extends ProcessRequest {
    @NotNull(message = "Workflow ID is required")
    private String workflowId;
    
    public WorkflowProcessRequest(String workflowId, Map<String, Object> parameters) {
        super(parameters);
        this.workflowId = workflowId;
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
	scala.collection.AbstractIterable.head(Iterable.scala:935)
	dotty.tools.dotc.interactive.InteractiveDriver.run(InteractiveDriver.scala:164)
	dotty.tools.pc.MetalsDriver.run(MetalsDriver.scala:45)
	dotty.tools.pc.HoverProvider$.hover(HoverProvider.scala:40)
	dotty.tools.pc.ScalaPresentationCompiler.hover$$anonfun$1(ScalaPresentationCompiler.scala:376)
```
#### Short summary: 

java.util.NoSuchElementException: next on empty iterator