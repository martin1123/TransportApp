<ul className="text-sm mt-1">
            {sugerenciasOrigen.map((s) => (
              <li key={s.id}>{s.place_name}</li>
            ))}
</ul>

<ul className="text-sm mt-1">
-            {sugerenciasDestino.map((s) => (
-              <li key={s.id}>{s.place_name}</li>
-            ))}
-          </ul>