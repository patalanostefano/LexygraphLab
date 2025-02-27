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
//oss: still need to (generally!) have a client that continuosly ask for the result: CAN'T JUST WAIT FOR IT!!
//design by CONTRACT