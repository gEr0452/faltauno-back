import threading
import time
import random

class CajaDeAhorro:
    def __init__(self):
        self.saldo = 0
        self.lock = threading.Lock()

    def depositar(self, cantidad, usuario_id):
        print(f"Usuario {usuario_id} intenta depositar {cantidad}\n ")
        self.lock.acquire()
        try:
            print(f"Depositando {cantidad} al saldo.\n")
            saldo_anterior = self.saldo
            time.sleep(random.uniform(0.1, 0.5))  
            self.saldo = saldo_anterior + cantidad
            print(f"Saldo actualizado({cantidad}): {self.saldo}\n")
        finally:
            self.lock.release()

class Usuario(threading.Thread):
    def __init__(self, id_usuario, caja, cantidad):
        super(Usuario,self).__init__()
        self.id_usuario = id_usuario
        self.caja = caja
        self.cantidad = cantidad

    def run(self):
        self.caja.depositar(self.cantidad, self.id_usuario)



if __name__ == "__main__":
    caja = CajaDeAhorro()

    usuarios = [Usuario(i+1, caja, 100) for i in range(5)]

    for u in usuarios:
        u.start()

    for u in usuarios:
        u.join()

    print(f"\nSaldo final en la caja: {caja.saldo}")