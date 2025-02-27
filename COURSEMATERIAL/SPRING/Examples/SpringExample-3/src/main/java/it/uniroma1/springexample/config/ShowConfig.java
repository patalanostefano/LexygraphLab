package it.uniroma1.springexample.config;

import it.uniroma1.springexample.*; 

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.PropertySource;

/* Configurazione Spring per l'applicazione Show. */
@Configuration
@ComponentScan("it.uniroma1.springexample")
@PropertySource("classpath:config.properties")
public class ShowConfig {

}
