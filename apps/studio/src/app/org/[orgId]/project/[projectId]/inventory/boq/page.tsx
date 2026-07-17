"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Download,
  RefreshCcw, 
  TrendingUp, 
  Package, 
  FileSpreadsheet,
  FileText,
  ChevronDown
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@k2net/ui";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@k2net/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@k2net/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@k2net/ui";
import { Badge } from "@k2net/ui";
import axios from "axios";
import { toast } from "sonner";

export default function BOQPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    grandTotal: number;
    items: Array<{
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalPrice: number;
    }>;
  } | null>(null);

  const fetchBOQ = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/v1/analytics/boq/${projectId}`);
      setData(response.data);
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to generate BOQ report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOQ();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const exportToExcel = () => {
    if (!data) return;
    const worksheet = XLSX.utils.json_to_sheet(data.items);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BOQ Report");
    XLSX.writeFile(workbook, `BOQ_Project_${projectId}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const exportToPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.text("Bill of Quantities Report", 14, 15);
    doc.text(`Project ID: ${projectId}`, 14, 22);
    doc.text(`Grand Total: ${formatCurrency(data.grandTotal)}`, 14, 29);

    autoTable(doc, {
      startY: 35,
      head: [["Description", "Quantity", "Unit", "Unit Price", "Total Price"]],
      body: data.items.map((item: { description: string; quantity: number; unit: string; unitPrice: number; totalPrice: number }) => [
        item.description,
        item.quantity.toFixed(2),
        item.unit,
        formatCurrency(item.unitPrice),
        formatCurrency(item.totalPrice),
      ]),
    });

    doc.save(`BOQ_Project_${projectId}.pdf`);
    toast.success("PDF exported successfully");
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">BOQ Generator</h2>
          <p className="text-muted-foreground">
            Automated Bill of Quantities & Material Estimator
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchBOQ}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Recalculate
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" />
                Export Report
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] bg-zinc-900 border-white/10 text-white">
              <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer hover:bg-white/5">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-primary" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer hover:bg-white/5">
                <FileText className="mr-2 h-4 w-4 text-blue-500" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Valuation</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data ? formatCurrency(data.grandTotal) : "---"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated project infrastructure cost
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Material Items</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.items?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique items identified
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-black/40 backdrop-blur-md overflow-hidden">
        <CardHeader className="bg-white/5">
          <CardTitle>Bill of Quantities Detail</CardTitle>
          <CardDescription>
            Calculated based on actual spatial data in PostGIS
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[40%] text-white">Description</TableHead>
                <TableHead className="text-white">Quantity</TableHead>
                <TableHead className="text-white">Unit</TableHead>
                <TableHead className="text-white text-right">Unit Price</TableHead>
                <TableHead className="text-white text-right">Total Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell colSpan={5} className="h-12 animate-pulse bg-white/5" />
                  </TableRow>
                ))
              ) : (
                data?.items?.map((item, index: number) => (
                  <TableRow key={index} className="border-border hover:bg-white/5">
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>{item.quantity.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white/5 border-white/10 text-xs">
                        {item.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(item.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
          <div className="text-right space-y-1">
             <p className="text-sm text-muted-foreground">Estimated Grand Total</p>
             <h3 className="text-4xl font-bold text-primary">
                {data ? formatCurrency(data.grandTotal) : "---"}
             </h3>
          </div>
      </div>
    </div>
  );
}
