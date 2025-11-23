<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
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
            padding: 8px;
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
        .summary-box {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .summary-item {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <div class="period"><strong>Período:</strong> {{ $period }}</div>
    </div>

    <div class="summary-box">
        <h2>Resumo Geral</h2>
        <div class="summary-item"><strong>Total de Consultas:</strong> {{ $data['total'] }}</div>
        <div class="summary-item"><strong>Período:</strong> {{ $data['start_date'] }} a {{ $data['end_date'] }}</div>
    </div>

    <h2>Consultas por Status</h2>
    <table>
        <thead>
            <tr>
                <th>Status</th>
                <th>Total</th>
                <th>Percentual</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['by_status'] as $status => $info)
            <tr>
                <td>{{ ucfirst(strtolower($status)) }}</td>
                <td>{{ $info['total'] }}</td>
                <td>{{ number_format($info['percentage'], 1) }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if(count($data['trend']) > 0)
    <h2>Tendência Diária</h2>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Total de Consultas</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['trend'] as $item)
            <tr>
                <td>{{ \Carbon\Carbon::parse($item['date'])->format('d/m/Y') }}</td>
                <td>{{ $item['total'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div class="footer">
        <p>Gerado em: {{ $generatedAt }}</p>
        <p>Agenda+ - Sistema de Gestão de Consultas</p>
    </div>
</body>
</html>

