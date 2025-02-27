/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package it.uniroma1.alternativesoapclient;

import javax.xml.namespace.QName;
import javax.xml.ws.Service;
import javax.xml.ws.soap.SOAPBinding;
import it.uniroma1.generatedsource.*;

/**
 *
 * @author mecellone-dev
 */
public class MainClient {
    
    private static QName SERVICE_NAME
            = new QName("http://exam.softeng.sapienza.it/", "Interface");
    private static QName PORT_NAME
            = new QName("http://exam.softeng.sapienza.it/", "InterfaceImplPort");

    private static Service service;
    private static Interface proxy;
    private static InterfaceImplService proxyImpl;

    
    public static void main(String[] args){

        service = Service.create(SERVICE_NAME);
            final String endpointAddress = "http://localhost:8080/Interface";
            service.addPort(PORT_NAME, SOAPBinding.SOAP11HTTP_BINDING, endpointAddress);
        
        proxyImpl = new InterfaceImplService();
        proxy = service.getPort(PORT_NAME, Interface.class);
        
        Professor prof = proxy.getDetails("1");
        System.out.println(prof);
        
    }
}
    
