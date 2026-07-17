"use client";

import React, { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { FileUp, AlertCircle, CheckCircle2, ChevronRight, Map as MapIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import axios from "axios";

interface ImportConflict {
  code: string;
  type: string;
  conflictType: string;
  message: string;
  existingData: Record<string, unknown>;
  newData: Record<string, unknown>;
}

export default function ImportPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const projectId = params?.projectId as string;

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    nodes: number;
    edges: number;
    errors: string[];
  } | null>(null);
  const [conflicts, setConflicts] = useState<ImportConflict[]>([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      validateFile(selectedFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.geojson'],
      'application/geo+json': ['.geojson'],
      'application/vnd.google-earth.kml+xml': ['.kml'],
    },
    multiple: false,
  });

  const validateFile = async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    setValidationResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("dryRun", "true");

    try {
      // Step 1: Analyze for conflicts
      const response = await axios.post(`/api/v1/network/import/${projectId}/analyze`, formData);

      setValidationResult({
        valid: true,
        nodes: response.data.totalFeatures,
        edges: 0,
        errors: [],
      });
      setConflicts(response.data.conflicts || []);
      setConflictCount(response.data.conflictCount || 0);
      
      if (response.data.conflictCount > 0) {
        toast.warning(`Found ${response.data.conflictCount} conflicts that need review.`);
      } else {
        toast.success("File analyzed! No conflicts found.");
      }
    } catch (error: unknown) {
      console.error("Validation error:", error);
      const message = error instanceof Error ? error.message : "Failed to validate file";
      toast.error(message);
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dryRun", "false");
    formData.append("resolutions", JSON.stringify(resolutions));

    try {
      const response = await axios.post(`/api/v1/network/import/${projectId}`, formData);
      toast.success(`Successfully imported ${response.data.importedNodes} assets!`);
      setStep(3); // Success step
    } catch (error: unknown) {
      console.error("Import error:", error);
      const message = error instanceof Error ? error.message : "Import failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">GIS Data Import</h2>
          <p className="text-muted-foreground">
            Bulk import network infrastructure from QGIS (GeoJSON / KML)
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-4">
          {/* Stepper Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`size-8 rounded-full border-2 flex items-center justify-center font-bold ${step >= 1 ? "border-emerald-500 bg-primary/10" : "border-muted"}`}>1</div>
              <span className="text-sm font-medium">Upload</span>
            </div>
            <div className="h-px w-8 bg-muted" />
            <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`size-8 rounded-full border-2 flex items-center justify-center font-bold ${step >= 2 ? "border-emerald-500 bg-primary/10" : "border-muted"}`}>2</div>
              <span className="text-sm font-medium">Mapping</span>
            </div>
            <div className="h-px w-8 bg-muted" />
            <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`size-8 rounded-full border-2 flex items-center justify-center font-bold ${step >= 3 ? "border-emerald-500 bg-primary/10" : "border-muted"}`}>3</div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>

          {step === 1 && (
            <Card className="border-border bg-black/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Select Design File</CardTitle>
                <CardDescription>
                  Upload your GeoJSON file exported from QGIS.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                    ${isDragActive ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 hover:border-white/20"}
                    ${file ? "border-emerald-500/50 bg-emerald-500/5" : ""}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <FileUp className="size-8" />
                    </div>
                    {file ? (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium">
                          {isDragActive ? "Drop the file here" : "Drag & drop file here"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Support .geojson and .kml files
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {isUploading && (
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Analyzing structure...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>
                )}

                {validationResult && (
                  <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-500">
                    <Alert className="bg-emerald-500/5 border-primary/20 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Validation Success</AlertTitle>
                      <AlertDescription>
                        Found {validationResult.nodes} nodes and {validationResult.edges} edges in the file.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border pt-6">
                <Button variant="ghost" onClick={() => setFile(null)} disabled={!file || isUploading}>
                  Clear
                </Button>
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!validationResult || isUploading}
                  className="bg-primary hover:bg-primary/90 text-white gap-2"
                >
                  {isUploading ? "Analyzing..." : "Review & Resolve"}
                  <ChevronRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-primary/20 bg-emerald-500/5 backdrop-blur-md animate-in zoom-in duration-300">
               <CardContent className="pt-12 pb-12 text-center space-y-6">
                  <div className="size-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-primary border border-primary/30 mx-auto">
                    <CheckCircle2 className="size-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-primary">Import Completed!</h3>
                    <p className="text-muted-foreground">Your network assets have been successfully synced to the database.</p>
                  </div>
                  <div className="flex justify-center gap-4 pt-4">
                    <Button onClick={() => window.location.href = `/org/${orgId}/project/${projectId}`} variant="default">
                      View on Map
                    </Button>
                    <Button onClick={() => setStep(1)} variant="outline">
                      Import More
                    </Button>
                  </div>
               </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="border-border bg-black/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className={`size-5 ${conflictCount > 0 ? "text-amber-500" : "text-primary"}`} />
                    Conflict Review
                  </CardTitle>
                  <CardDescription>
                    {conflictCount > 0 
                      ? `We found ${conflictCount} items that already exist in the database. Please review them before proceeding.`
                      : "No conflicts found. You can proceed with the import safely."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {conflictCount > 0 ? (
                    <div className="rounded-xl border border-white/10 overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3">Asset Code</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Conflict</th>
                            <th className="px-4 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {conflicts.map((conflict, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-4 font-mono font-bold text-foreground">{conflict.code}</td>
                              <td className="px-4 py-4"><span className="px-2 py-0.5 rounded-full bg-muted text-[10px]">{conflict.type}</span></td>
                              <td className="px-4 py-4 text-xs text-amber-500/80 italic">{conflict.message}</td>
                              <td className="px-4 py-4">
                                <select 
                                  className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] outline-hidden focus:ring-1 focus:ring-primary"
                                  value={resolutions[conflict.code] || "SKIP"}
                                  onChange={(e) => setResolutions({ ...resolutions, [conflict.code]: e.target.value })}
                                >
                                  <option value="SKIP">SKIP</option>
                                  <option value="OVERWRITE">OVERWRITE</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                       <CheckCircle2 className="size-12 text-primary mx-auto mb-4" />
                       <p className="text-sm font-medium">All systems clear!</p>
                       <p className="text-xs text-muted-foreground mt-1">Ready to sync {validationResult?.nodes} assets.</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t border-border pt-6">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    Back to Upload
                  </Button>
                  <Button 
                    onClick={handleImport}
                    className="bg-primary hover:bg-primary/90 text-white gap-2"
                  >
                    Confirm & Sync Data
                    <ChevronRight className="size-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border bg-black/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="size-4 text-primary" />
                Import Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Standard Requirements:</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>EPSG:4326 (WGS84) Projection</li>
                  <li>Nodes must have a &quot;code&quot; property</li>
                  <li>Lines must have &quot;source&quot; and &quot;target&quot; codes</li>
                </ul>
              </div>
              <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                 <p className="text-xs leading-relaxed">
                   <strong>Pro-tip:</strong> Ensure your ODP names in QGIS match the naming convention in this project for automatic parent-linking.
                 </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-black/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapIcon className="size-4 text-primary" />
                Data Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="aspect-square rounded-lg bg-white/5 border border-border flex items-center justify-center text-muted-foreground">
                  <p className="text-[10px] text-center px-6">
                    A map preview will appear here after field mapping is complete.
                  </p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
