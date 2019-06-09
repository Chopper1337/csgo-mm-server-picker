import Ping from 'ping-lite';

export default class PingWrapper {
  constructor(clusters, window) {
    this._clusters = clusters;
    this._mainWindow = window;
  }

  // Lance le ping sur tous les serveurs de Valve
  execute() {
    try {
      this._clusters.clustersId.forEach(id => {

        this._clusters.pops[id].relayAddresses.forEach(relayAddresse => {
          this._clusters.pops[id].relayAddresses.splice(this._clusters.pops[id].relayAddresses.indexOf(relayAddresse), 1, relayAddresse.split(':')[0]);
        });

        const hosts = this._clusters.pops[id].relayAddresses;

        hosts.forEach(host => {
          var ping = new Ping(host);

          ping.send((err, time) => {
            
            if (err === null && time !== null) {
              this._updateClusterStatus(host, time, true);
            }
            else {
              this._updateClusterStatus(host, 0, false);
            }
          });

          setTimeout(function() {
            ping.stop();
          }, 30000);
        });
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Mets à jour le status des serveurs et informe l'IHM
  _updateClusterStatus(host, time, alive) {
    try {
      this._clusters.clustersId.forEach(id => {

        this._clusters.pops[id].relayAddresses.forEach(relayAddresse => {
          
          if (relayAddresse === host) {
            this._mainWindow.webContents.send('update-ip-list', [id, host, this._clusters.pops[id].cityName, this._clusters.pops[id].continentId, time, alive]);

            if (time < this._clusters.pops[id].status.time || this._clusters.pops[id].status.time === 0) {

              this._clusters.pops[id].status.isAlive = alive;
              this._clusters.pops[id].status.time = time;

              this._mainWindow.webContents.send('request-update-ping', [this._clusters.pops[id].continentId, this._clusters.pops[id].status.time]);

            }
          }
        });
      });
    } catch (error) {
      console.log(error);
    }
  }
}