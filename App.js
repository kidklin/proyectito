// ============================================================
// Llega Quito (avance) - React Native + Expo
// Varios buses SIMULADOS por linea + ETA estimado
// ============================================================
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
 
// ------------------------------------------------------------
// 1) DATOS. Las coordenadas son APROXIMADAS (de ejemplo).
//    Reemplacenlas por las reales: en Google Maps, clic derecho
//    sobre cada parada -> se copia "lat, lng".
//    minEntreParadas es una estimacion: ajustenla con datos reales.
// ------------------------------------------------------------
const NUM_BUSES = 5; // cuantas unidades circulan por linea (cambienlo si quieren)
 
const LINEAS = {
  trole: {
    nombre: "Trolebús",
    color: "#1D6F6B",
    minEntreParadas: 2.5, // minutos promedio entre paradas
    paradas: [
      { id: 0, nombre: "Parada 1 (La Y)", lat: -0.1475, lng: -78.4825 },
      { id: 1, nombre: "Parada 2", lat: -0.1605, lng: -78.4838 },
      { id: 2, nombre: "Parada 3", lat: -0.1735, lng: -78.4855 },
      { id: 3, nombre: "Parada 4", lat: -0.1875, lng: -78.4880 },
      { id: 4, nombre: "Parada 5", lat: -0.2010, lng: -78.4912 },
      { id: 5, nombre: "Parada 6", lat: -0.2135, lng: -78.4955 },
      { id: 6, nombre: "Parada 7", lat: -0.2250, lng: -78.5000 },
      { id: 7, nombre: "Parada 8", lat: -0.2390, lng: -78.5050 },
    ],
  },
  ecovia: {
    nombre: "Ecovía",
    color: "#B5532F",
    minEntreParadas: 2.0,
    paradas: [
      { id: 0, nombre: "Parada 1", lat: -0.1700, lng: -78.4700 },
      { id: 1, nombre: "Parada 2", lat: -0.1820, lng: -78.4740 },
      { id: 2, nombre: "Parada 3", lat: -0.1950, lng: -78.4780 },
      { id: 3, nombre: "Parada 4", lat: -0.2080, lng: -78.4820 },
      { id: 4, nombre: "Parada 5", lat: -0.2200, lng: -78.4860 },
      { id: 5, nombre: "Parada 6", lat: -0.2340, lng: -78.4900 },
    ],
  },
};
 
// ------------------------------------------------------------
// 2) LOGICA
// ------------------------------------------------------------
const TICK_MS = 200; // cada cuanto se mueven los buses simulados
const PASO = 0.02; // cuanto avanzan por tick (0.1 parada/seg)
 
// Reparte los buses de forma pareja a lo largo de la ruta
function crearBuses(ultima) {
  return Array.from({ length: NUM_BUSES }, (_, i) => (i * ultima) / NUM_BUSES);
}
 
// Posicion de un bus entre paradas (progress tiene decimales)
function posicionBus(paradas, progress) {
  const i = Math.min(Math.floor(progress), paradas.length - 2);
  const t = progress - i;
  const a = paradas[i];
  const b = paradas[i + 1];
  return {
    latitude: a.lat + (b.lat - a.lat) * t,
    longitude: a.lng + (b.lng - a.lng) * t,
  };
}
 
// ETA de cada bus para la parada elegida, ordenados del mas cercano al mas lejano
function calcularETAs(linea, progresos, paradaIndex) {
  const ultima = linea.paradas.length - 1;
  return progresos
    .map((p, i) => {
      let faltan = paradaIndex - p;
      if (faltan < 0) faltan += ultima; // ya paso: llega en la proxima vuelta
      return {
        bus: i + 1,
        minutos: Math.max(1, Math.ceil(faltan * linea.minEntreParadas)),
      };
    })
    .sort((a, b) => a.minutos - b.minutos);
}
 
// ------------------------------------------------------------
// 3) PANTALLA
// ------------------------------------------------------------
export default function App() {
  const [lineaId, setLineaId] = useState("trole");
  const [paradaIndex, setParadaIndex] = useState(3);
  const [progresos, setProgresos] = useState(() =>
    crearBuses(LINEAS.trole.paradas.length - 1)
  );
 
  const linea = LINEAS[lineaId];
  const ultima = linea.paradas.length - 1;
 
  // Reinicia los buses al cambiar de linea
  useEffect(() => {
    setProgresos(crearBuses(ultima));
    setParadaIndex(Math.min(3, ultima));
  }, [lineaId]);
 
  // Simulacion: todos avanzan y al llegar al final vuelven a empezar
  useEffect(() => {
    const timer = setInterval(() => {
      setProgresos((lista) =>
        lista.map((p) => (p + PASO >= ultima ? 0 : p + PASO))
      );
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [lineaId, ultima]);
 
  const etas = calcularETAs(linea, progresos, paradaIndex);
  const proximo = etas[0];
  const siguiente = etas[1];
  const parada = linea.paradas[paradaIndex];
  const coords = linea.paradas.map((p) => ({ latitude: p.lat, longitude: p.lng }));
 
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
 
      <MapView
        style={s.map}
        initialRegion={{
          latitude: -0.2,
          longitude: -78.49,
          latitudeDelta: 0.13,
          longitudeDelta: 0.08,
        }}
      >
        <Polyline coordinates={coords} strokeColor={linea.color} strokeWidth={4} />
 
        {linea.paradas.map((p) => (
          <Marker
            key={`${lineaId}-${p.id}`}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            title={p.nombre}
            pinColor={p.id === paradaIndex ? "#111" : linea.color}
            onPress={() => setParadaIndex(p.id)}
          />
        ))}
 
        {progresos.map((p, i) => (
          <Marker
            key={`${lineaId}-bus-${i}`}
            coordinate={posicionBus(linea.paradas, p)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={[
                s.bus,
                { backgroundColor: linea.color },
                proximo.bus === i + 1 && s.busProximo,
              ]}
            >
              <Text style={s.busTxt}>{i + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
 
      <View style={s.panel}>
        {/* Selector de linea */}
        <View style={s.fila}>
          {Object.entries(LINEAS).map(([id, l]) => (
            <TouchableOpacity
              key={id}
              onPress={() => setLineaId(id)}
              style={[
                s.chipLinea,
                lineaId === id && { backgroundColor: l.color, borderColor: l.color },
              ]}
            >
              <Text style={[s.chipLineaTxt, lineaId === id && { color: "#fff" }]}>
                {l.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
 
        {/* Selector de parada */}
        <Text style={s.label}>Tu parada</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {linea.paradas.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setParadaIndex(p.id)}
              style={[s.chipParada, p.id === paradaIndex && s.chipParadaOn]}
            >
              <Text style={[s.chipParadaTxt, p.id === paradaIndex && { color: "#fff" }]}>
                {p.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
 
        {/* Resultado */}
        <View style={s.resultado}>
          <Text style={s.etaNum}>{proximo.minutos}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.etaTxt}>
              {proximo.minutos === 1 ? "minuto" : "minutos"} para que llegue el bus{" "}
              {proximo.bus} a {parada.nombre}
            </Text>
            <Text style={s.aviso}>
              Después llega el bus {siguiente.bus} en {siguiente.minutos} min. Tiempos
              estimados con datos simulados
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
 
// ------------------------------------------------------------
// 4) ESTILOS
// ------------------------------------------------------------
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F7F5" },
  map: { flex: 1 },
  bus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  busProximo: { borderColor: "#111", borderWidth: 3, width: 34, height: 34, borderRadius: 17 },
  busTxt: { fontSize: 13, fontWeight: "700", color: "#fff" },
  panel: {
    padding: 16,
    paddingBottom: 28,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  fila: { flexDirection: "row", marginBottom: 12 },
  chipLinea: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#CFCFCA",
    marginRight: 8,
  },
  chipLineaTxt: { fontWeight: "600", color: "#333" },
  label: { fontSize: 13, color: "#666", marginBottom: 6 },
  chipParada: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#EEEEEA",
    marginRight: 8,
  },
  chipParadaOn: { backgroundColor: "#111" },
  chipParadaTxt: { color: "#333", fontSize: 13 },
  resultado: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  etaNum: { fontSize: 56, fontWeight: "700", color: "#111", marginRight: 14 },
  etaTxt: { fontSize: 16, color: "#111" },
  aviso: { fontSize: 12, color: "#888", marginTop: 4 },
});