import threading
import time
import random


class Asiento():
    def __init__(self,lock,nombre):
        self.lock = lock
        self.disponible = True
        self.nombre = nombre
    
    def reservar(self):
        with self.lock:
            if self.disponible:
                self.disponible = False
                res = True
            else:
                res = False
        
        return res
    
    
class Cliente(threading.Thread):
    def __init__(self,nombre,semaphore,asientos):
        super().__init__()
        self.nombre = nombre
        self.semaphore = semaphore
        self.asientos = asientos
    
    def run(self):
        with self.semaphore:
            self.realizareserva()
    
    def realizareserva(self):
        reservas_realizadas = 0
        intentos = 0
        
        while reservas_realizadas < 3 and intentos < len(self.asientos):
            time.sleep(random.uniform(3,5))
            if self.asientos[intentos].reservar():
                print(f"{self.nombre} reservo el asiento {self.asientos[intentos].nombre} exitosamente")
                reservas_realizadas +=1
            intentos +=1
        if reservas_realizadas == 0:
            print(f"{self.nombre} no pudo reservar asientos")
        
        print(f"{self.nombre} ha terminado de hacer reservas")


def main():
    asientos = []
    lock = threading.Lock()
    for i in range(10):
        asiento = Asiento(lock,f"Asiento {i+1}")
        asientos.append(asiento)
    
    semaphore = threading.Semaphore(3)
    
    clientes = []
    
    for i in range(5):
        cliente = Cliente(f"Cliente {i+1}",semaphore,asientos)
        clientes.append(cliente)
    
    for cliente in clientes:
        cliente.start()
        
    for cliente in clientes:
        cliente.join()
        

if __name__ == "__main__":
    main()