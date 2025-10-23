import threading
import time
import random

class Semaforo:
    def __init__(self):
        self.event = threading.Event()
        
    def verde(self):
        print("Semaforo en verde")
        self.event.set()
    
    def rojo(self):
        print("Semaforo en rojo")
        self.event.clear()
    
    def esperar_verde(self):
        self.event.wait()
        
class Vehiculo(threading.Thread):
    def __init__(self,nombre,lock,semaforo):
        super().__init__()
        self.nombre = nombre
        self.lock = lock
        self.semaforo = semaforo
        
    def run(self):
        time.sleep(random.uniform(0.5,1.5))
        print(f"El {self.nombre} llego a la interseccion\n", end="")
        self.cruzarinterseccion()
    
    def cruzarinterseccion(self):
        
        with self.lock:
            self.semaforo.esperar_verde()
            print(f"El {self.nombre} esta cruzando la interseccion\n", end="")
            time.sleep(random.uniform(0.5,1.5))
            print(f"El {self.nombre} cruzo la interseccion\n", end="")
            
 
def controlar_semaforo(semaforo):
    while True:
        semaforo.verde()
        time.sleep(1.5)
        semaforo.rojo()
        time.sleep(1.5)

def main():
    semaforo = Semaforo()
    interseccion_lock = threading.Lock()
    
    hilo_semaforo = threading.Thread(target = controlar_semaforo, args = (semaforo,))
    hilo_semaforo.daemon = True
    hilo_semaforo.start()
    
    vehiculos = []
    for i in range(5):
        vehiculo = Vehiculo(f"Vehiculo {i+1}",interseccion_lock,semaforo)
        vehiculos.append(vehiculo)
    
    for u in vehiculos:
        u.start()
        
    
    for u in vehiculos:
        u.join()


if __name__ == "__main__":
    main()