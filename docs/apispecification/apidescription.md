# 1 documents: pdf storage based on the only id and 1 table containing all i ve said

the yml file containing the simple communication between
the frontend and the storage service:

 basic doc memorizing functionality storage + retrieval based on simple ids and we will use supabase for all the databases so you just need to also design a super simple database schema for such user + project + project docs
each proj will have docs which will have titles and id and plain text content


# 2 agents: 
frontend will call agent service with a simple prompt + ids (variable numb) of documents the user will select to attach to the prompt
the orchestrator will answer with a strategy ie a simple text answer explaining the plan

the frontend will answer again to either confirm ( so a bool?) or modify with additional instruction for the orchestrator

continue like this till: finally the frontend confirm the plan then the orchestrator should again call the api gateway with a variable lenght json payload containing an object like:agent id (we will use env files for them) + prompt for that agent + doc ids for using with that prompt

the api gateway should JUST route this json payload to the correspondant agent service and wait for an answer being: just equal but the response of the agent instead of the answer

