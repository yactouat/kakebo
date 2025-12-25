import { Table } from '@mantine/core';
import type { IncomeEntry } from '../models/IncomeEntry';

interface IncomeTableProps {
  incomeData: IncomeEntry[];
  totalShown: number;
}

const IncomeTable = ({ incomeData, totalShown }: IncomeTableProps) => {
  return (
    <Table striped highlightOnHover withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Amount</Table.Th>
          <Table.Th>Date</Table.Th>
          <Table.Th>Item</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {incomeData.length > 0 ? (
          incomeData.map((entry, index) => (
            <Table.Tr key={index}>
              <Table.Td>{entry.amount}</Table.Td>
              <Table.Td>{entry.date}</Table.Td>
              <Table.Td>{entry.item}</Table.Td>
            </Table.Tr>
          ))
        ) : (
          <Table.Tr>
            <Table.Td colSpan={3} style={{ textAlign: 'center' }}>
              No income data available
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
      <Table.Tfoot>
        <Table.Tr>
          <Table.Td colSpan={2} style={{ fontWeight: 'bold', textAlign: 'right' }}>
            Total Shown:
          </Table.Td>
          <Table.Td style={{ fontWeight: 'bold' }}>
            {totalShown}
          </Table.Td>
        </Table.Tr>
      </Table.Tfoot>
    </Table>
  );
};

export default IncomeTable;

