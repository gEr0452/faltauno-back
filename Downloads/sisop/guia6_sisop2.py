import threading
import time
import random

class Consumer(threading.Thread):
    def __init__(self,condition,lst,items):
        super().__init__()
        self.condition = condition
        self.lst = lst
        self.items = items
    
    def run(self):
        for i in range (self.items):
            with self.condition:
                while not self.lst:
                    self.condition.wait()
                msg = self.lst.pop(0)
                print(f"Consumidor recibio: {msg}")
                time.sleep(random.uniform(0.5,1.5))

class Producer(threading.Thread):
    def __init__(self,condition,lst,items):
        super().__init__()
        self.condition = condition
        self.lst = lst
        self.items = items
    
    def run(self):
        for i in range (self.items):
            time.sleep(random.uniform(0.5,1.5))
            msg = f"Mensaje {i+1}"
            with self.condition:
                self.lst.append(msg)
                print(f"Productor envio: {msg}")
                self.condition.notify()

def main():
    condition = threading.Condition()
    lst = []
    items = 10
    
    producer = Producer(condition,lst,items)
    consumer = Consumer(condition,lst,items)
    
    producer.start()
    consumer.start()

    producer.join()
    consumer.join()
    

if __name__ == "__main__":
    main()