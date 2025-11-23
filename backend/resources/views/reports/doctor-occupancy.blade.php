<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            margin: 20px;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header {
            margin-bottom: 20px;
        }
        .period {
            color: #666;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            font-size: 10px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <div class="period"><strong>Período:</strong> {{ $period }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Médico</th>
                <th>Total de Consultas</th>
                <th>Confirmadas</th>
                <th>Realizadas</th>
                <th>Taxa de Ocupação (%)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $item)
            <tr>
                <td>{{ $item['doctor_name'] }}</td>
                <td>{{ $item['total_appointments'] }}</td>
                <td>{{ $item['confirmed'] }}</td>
                <td>{{ $item['completed'] }}</td>
                <td>{{ number_format($item['occupancy_rate'], 1) }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Gerado em: {{ $generatedAt }}</p>
        <p>Agenda+ - Sistema de Gestão de Consultas</p>
    </div>
</body>
</html>

