package it.uniroma1.springexample;

import it.uniroma1.springexample.config.ShowConfig; 

import java.util.logging.Logger;

import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

public class Main {

	/* logger */
	private static Logger logger = Logger.getLogger("Show");

	public static void main(String[] args) {
    	ApplicationContext context = new AnnotationConfigApplicationContext(ShowConfig.class); 
    	Artist artist = (Artist) context.getBean("hendrix");
		logger.info( artist.perform() );
	}

}
