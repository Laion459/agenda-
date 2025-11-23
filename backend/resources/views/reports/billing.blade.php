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
        .summary {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .summary-item {
            display: inline-block;
            margin-right: 30px;
        }
        .summary-label {
            font-weight: bold;
            color: #666;
        }
        .summary-value {
            font-size: 18px;
            color: #333;
            margin-top: 5px;
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
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .footer {
            margin-top: 30px;
            text-align: right;
            color: #666;
            font-size: 10px;
        }
        .currency {
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <div class="period">Período: {{ $period }}</div>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="summary-label">Receita Total</div>
            <div class="summary-value">R$ {{ number_format($data['total_revenue'], 2, ',', '.') }}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Total de Consultas</div>
            <div class="summary-value">{{ number_format($data['total_appointments'], 0, ',', '.') }}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Ticket Médio</div>
            <div class="summary-value">R$ {{ number_format($data['average_ticket'], 2, ',', '.') }}</div>
        </div>
    </div>

    <h2>Faturamento por Status</h2>
    <table>
        <thead>
            <tr>
                <th>Status</th>
                <th class="currency">Receita</th>
                <th>Quantidade</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['by_status'] as $status => $info)
            <tr>
                <td>{{ $status }}</td>
                <td class="currency">R$ {{ number_format($info['revenue'], 2, ',', '.') }}</td>
                <td>{{ number_format($info['count'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h2>Faturamento por Médico</h2>
    <table>
        <thead>
            <tr>
                <th>Médico</th>
                <th class="currency">Receita</th>
                <th>Consultas</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['by_doctor'] as $doctor)
            <tr>
                <td>{{ $doctor['doctor_name'] }}</td>
                <td class="currency">R$ {{ number_format($doctor['revenue'], 2, ',', '.') }}</td>
                <td>{{ number_format($doctor['appointments_count'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h2>Faturamento por Mês</h2>
    <table>
        <thead>
            <tr>
                <th>Mês</th>
                <th class="currency">Receita</th>
                <th>Consultas</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['by_month'] as $month)
            <tr>
                <td>{{ \Carbon\Carbon::createFromFormat('Y-m', $month['month'])->format('m/Y') }}</td>
                <td class="currency">R$ {{ number_format($month['revenue'], 2, ',', '.') }}</td>
                <td>{{ number_format($month['count'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Gerado em: {{ $generatedAt }}
    </div>
</body>
</html>

