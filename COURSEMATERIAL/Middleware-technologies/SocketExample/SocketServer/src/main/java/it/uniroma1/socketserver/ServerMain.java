package it.uniroma1.socketserver;

import java.io.*;
import java.net.*;
import java.util.*;

public class ServerMain {

    public static void main(String[] args) {

        List<ClientThread> ctList = new ArrayList<ClientThread>();   //list of the client threads the server serve
        ServerSocket lis = null;    

        try {
            lis = new ServerSocket(Integer.parseInt(args[0]));  //start a new server socket (arg is the port)
        } catch (IOException e1) {
            System.out.println("Errore nella creazione del ServerSocket, applicazione dismessa");
            System.exit(1);
        }
        System.out.println("Server avviato");
        Socket sock = null;

        while (true) {
            try {
                sock = lis.accept();       //acceping the client request 
            } catch (IOException e) {
                break;
            }
            System.out.println("Socket creata, connessione accettata");
            ClientThread cl = new ClientThread(sock);  //creating the thread for that client
            Thread tr = new Thread(cl);
            tr.start();
            ctList.add(cl);
        }
    }

}
