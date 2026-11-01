import { useState } from 'react';
import './App.css';

type Mecz = {
  gospodarz: string;
  gosc: string;
  goleGospodarzy: number;
  goleGosci: number;
};

function App() {
  const [druzyny, setDruzyny] = useState<string[]>([]);
  const [nazwa, setNazwa] = useState('');
  const [mecze, setMecze] = useState<Mecz[]>([]);

  const [gospodarz, setGospodarz] = useState('');
  const [gosc, setGosc] = useState('');
  const [goleGospodarzy, setGoleGospodarzy] = useState('');
  const [goleGosci, setGoleGosci] = useState('');

  function dodajDruzyne() {
    const nowaNazwa = nazwa.trim();

    if (!nowaNazwa) return;
    if (druzyny.includes(nowaNazwa)) return;

    setDruzyny([...druzyny, nowaNazwa]);
    setNazwa('');
  }

  function usunDruzyne(druzyna: string) {
    setDruzyny(druzyny.filter((d) => d !== druzyna));
    setMecze(
      mecze.filter((m) => m.gospodarz !== druzyna && m.gosc !== druzyna)
    );
  }

  function dodajMecz() {
    if (!gospodarz || !gosc || gospodarz === gosc) return;
    if (goleGospodarzy.trim() === '' || goleGosci.trim() === '') return;

    const wynikGospodarzy = Number(goleGospodarzy);
    const wynikGosci = Number(goleGosci);

    if (
      !Number.isInteger(wynikGospodarzy) ||
      !Number.isInteger(wynikGosci) ||
      wynikGospodarzy < 0 ||
      wynikGosci < 0
    )
      return;

    setMecze([
      ...mecze,
      {
        gospodarz,
        gosc,
        goleGospodarzy: wynikGospodarzy,
        goleGosci: wynikGosci,
      },
    ]);

    setGoleGospodarzy('');
    setGoleGosci('');
  }

  const tabela = druzyny.map((druzyna) => {
    const statystyki = {
      nazwa: druzyna,
      mecze: 0,
      zwyciestwa: 0,
      remisy: 0,
      porazki: 0,
      goleZdobyte: 0,
      goleStracone: 0,
      punkty: 0,
    };

    for (const mecz of mecze) {
      if (mecz.gospodarz !== druzyna && mecz.gosc !== druzyna) {
        continue;
      }

      statystyki.mecze++;

      if (mecz.gospodarz === druzyna) {
        statystyki.goleZdobyte += mecz.goleGospodarzy;
        statystyki.goleStracone += mecz.goleGosci;
      } else {
        statystyki.goleZdobyte += mecz.goleGosci;
        statystyki.goleStracone += mecz.goleGospodarzy;
      }

      if (mecz.goleGospodarzy === mecz.goleGosci) {
        statystyki.remisy++;
        statystyki.punkty++;
      } else {
        const wygralGospodarz = mecz.goleGospodarzy > mecz.goleGosci;

        const wygralaDruzyna =
          (mecz.gospodarz === druzyna && wygralGospodarz) ||
          (mecz.gosc === druzyna && !wygralGospodarz);

        if (wygralaDruzyna) {
          statystyki.zwyciestwa++;
          statystyki.punkty += 3;
        } else {
          statystyki.porazki++;
        }
      }
    }

    return statystyki;
  });

  const roznicaBramkowa = (d: (typeof tabela)[number]) =>
    d.goleZdobyte - d.goleStracone;

  function punktyHeadToHead(nazwa: string, grupa: typeof tabela) {
    const zespoly = new Set(grupa.map((d) => d.nazwa));
    let punkty = 0;

    for (const mecz of mecze) {
      if (!zespoly.has(mecz.gospodarz) || !zespoly.has(mecz.gosc)) continue;

      if (mecz.gospodarz !== nazwa && mecz.gosc !== nazwa) {
        continue;
      }

      if (mecz.goleGospodarzy === mecz.goleGosci) {
        punkty += 1;
      } else {
        const wygralGospodarz = mecz.goleGospodarzy > mecz.goleGosci;

        const wygralaDruzyna =
          (mecz.gospodarz === nazwa && wygralGospodarz) ||
          (mecz.gosc === nazwa && !wygralGospodarz);

        if (wygralaDruzyna) punkty += 3;
      }
    }

    return punkty;
  }

  function procentWygranychPrzeciwnikow(nazwa: string) {
    const przeciwnicy = [
      ...new Set(
        mecze
          .filter((m) => m.gospodarz === nazwa || m.gosc === nazwa)
          .map((m) => (m.gospodarz === nazwa ? m.gosc : m.gospodarz))
      ),
    ];

    if (przeciwnicy.length === 0) return 0;

    const procenty = przeciwnicy.map((przeciwnik) => {
      const meczePrzeciwnika = mecze.filter(
        (m) =>
          (m.gospodarz === przeciwnik || m.gosc === przeciwnik) &&
          m.gospodarz !== nazwa &&
          m.gosc !== nazwa
      );

      if (meczePrzeciwnika.length === 0) return 0;

      let wygrane = 0;
      let remisy = 0;

      for (const m of meczePrzeciwnika) {
        const goleA =
          m.gospodarz === przeciwnik ? m.goleGospodarzy : m.goleGosci;

        const goleB =
          m.gospodarz === przeciwnik ? m.goleGosci : m.goleGospodarzy;

        if (goleA > goleB) wygrane++;
        else if (goleA === goleB) remisy++;
      }

      return (wygrane + remisy * 0.5) / meczePrzeciwnika.length;
    });

    return procenty.reduce((suma, p) => suma + p, 0) / procenty.length;
  }

  tabela.sort((a, b) => {
    const podstawowe =
      b.punkty - a.punkty ||
      roznicaBramkowa(b) - roznicaBramkowa(a) ||
      b.goleZdobyte - a.goleZdobyte;

    if (podstawowe !== 0) return podstawowe;

    const grupa = tabela.filter(
      (d) =>
        d.punkty === a.punkty &&
        roznicaBramkowa(d) === roznicaBramkowa(a) &&
        d.goleZdobyte === a.goleZdobyte
    );

    const bezposrednie =
      punktyHeadToHead(b.nazwa, grupa) - punktyHeadToHead(a.nazwa, grupa);

    if (bezposrednie !== 0) return bezposrednie;

    return (
      procentWygranychPrzeciwnikow(b.nazwa) -
      procentWygranychPrzeciwnikow(a.nazwa)
    );
  });

  return (
    <main>
      <h1>Menadżer turniejów</h1>
      <h2>Drużyny</h2>
      <input
        value={nazwa}
        onChange={(e) => setNazwa(e.target.value)}
        placeholder="Nazwa drużyny"
      />
      <button onClick={dodajDruzyne}>Dodaj drużynę</button>
      <ul>
        {druzyny.map((druzyna) => (
          <li key={druzyna}>
            {druzyna} <button onClick={() => usunDruzyne(druzyna)}>Usuń</button>
          </li>
        ))}
      </ul>
      <hr />
      <h2>Dodaj mecz</h2>
      <select value={gospodarz} onChange={(e) => setGospodarz(e.target.value)}>
        <option value="">Wybierz gospodarza</option>
        {druzyny.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>{' '}
      <input
        type="number"
        min="0"
        value={goleGospodarzy}
        onChange={(e) => setGoleGospodarzy(e.target.value)}
        placeholder="Gole"
      />
      {' – '}
      <input
        type="number"
        min="0"
        value={goleGosci}
        onChange={(e) => setGoleGosci(e.target.value)}
        placeholder="Gole"
      />{' '}
      <select value={gosc} onChange={(e) => setGosc(e.target.value)}>
        <option value="">Wybierz gościa</option>
        {druzyny.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <p>
        <button onClick={dodajMecz} disabled={druzyny.length < 2}>
          Zapisz mecz
        </button>
      </p>
      <h2>Rozegrane mecze</h2>
      {mecze.length === 0 && <p>Brak zapisanych meczów.</p>}
      <ul>
        {mecze.map((mecz, index) => (
          <li key={index}>
            {mecz.gospodarz} {mecz.goleGospodarzy}
            {' : '}
            {mecz.goleGosci} {mecz.gosc}
          </li>
        ))}
      </ul>
      <h2>Tabela ligowa</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Drużyna</th>
            <th>M</th>
            <th>W</th>
            <th>R</th>
            <th>P</th>
            <th>Bramki</th>
            <th>+/-</th>
            <th>Pkt</th>
          </tr>
        </thead>

        <tbody>
          {tabela.map((druzyna, index) => (
            <tr key={druzyna.nazwa}>
              <td>{index + 1}</td>
              <td>{druzyna.nazwa}</td>
              <td>{druzyna.mecze}</td>
              <td>{druzyna.zwyciestwa}</td>
              <td>{druzyna.remisy}</td>
              <td>{druzyna.porazki}</td>
              <td>
                {druzyna.goleZdobyte}:{druzyna.goleStracone}
              </td>
              <td>{druzyna.goleZdobyte - druzyna.goleStracone}</td>
              <td>{druzyna.punkty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default App;
