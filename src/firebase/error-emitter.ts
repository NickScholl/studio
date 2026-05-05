
type Callback = (data: any) => void;

class ErrorEmitter {
  private events: { [key: string]: Callback[] } = {};

  on(event: string, callback: Callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, data: any) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

export const errorEmitter = new ErrorEmitter();
